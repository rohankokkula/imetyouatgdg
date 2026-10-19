-- I Met You At GDG — schema
-- Run this once in the Supabase SQL editor (or `supabase db push`).

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text not null default '',
  avatar_url      text,
  linkedin_handle text,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "signed-in users can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (linkedin_handle) on public.profiles to authenticated;

-- Copy name + photo from LinkedIn on signup, and refresh them on every login
-- (LinkedIn photo URLs are signed and expire).
create function public.sync_profile_from_auth()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'picture', new.raw_user_meta_data ->> 'avatar_url')
  )
  on conflict (id) do update
    set name       = excluded.name,
        avatar_url = excluded.avatar_url;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.sync_profile_from_auth();

create trigger on_auth_user_updated
  after update of raw_user_meta_data on auth.users
  for each row execute function public.sync_profile_from_auth();

-- ───────────────────────── connections ─────────────────────────
-- One row per pair. user_a < user_b keeps the pair canonical, so
-- duplicates and self-connections are impossible.
create table public.connections (
  id         bigint generated always as identity primary key,
  user_a     uuid not null references public.profiles (id) on delete cascade,
  user_b     uuid not null references public.profiles (id) on delete cascade,
  scanner_id uuid not null references public.profiles (id) on delete cascade,
  note_a     text,  -- written by user_a, visible to both
  note_b     text,  -- written by user_b, visible to both
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index connections_user_b_idx on public.connections (user_b);

alter table public.connections enable row level security;

-- Only the two people in a connection can read its row (and therefore the notes).
create policy "parties can read their connection"
  on public.connections for select to authenticated
  using (auth.uid() in (user_a, user_b));

revoke all on public.connections from anon, authenticated;
grant select on public.connections to authenticated;
-- No insert/update grants: writes go through connect() / set_note() below.

alter publication supabase_realtime add table public.connections;

-- ───────────────────────── functions ─────────────────────────

-- Set (or clear) my note on an existing connection with `other`.
create function public.set_note(other uuid, note text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  n  text := nullif(btrim(left(note, 500)), '');
begin
  if me is null then raise exception 'not signed in'; end if;
  update public.connections
     set note_a = case when user_a = me then n else note_a end,
         note_b = case when user_b = me then n else note_b end
   where user_a = least(me, other) and user_b = greatest(me, other);
end $$;

-- Called by the person who scanned `target`'s QR code.
create function public.connect(target uuid, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  if target = me then raise exception 'you cannot connect with yourself'; end if;
  if not exists (select 1 from public.profiles where id = target) then
    raise exception 'unknown person';
  end if;

  insert into public.connections (user_a, user_b, scanner_id)
  values (least(me, target), greatest(me, target), me)
  on conflict (user_a, user_b) do nothing;

  if nullif(btrim(note), '') is not null then
    perform public.set_note(target, note);
  end if;
end $$;

-- The whole event graph in one call (no notes). Returned as a single JSON
-- value so it isn't capped by the API's 1000-row limit.
create function public.event_graph()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'nodes', coalesce((
      select json_agg(json_build_object(
        'id', id, 'name', name, 'avatar', avatar_url, 'handle', linkedin_handle))
      from public.profiles), '[]'::json),
    'links', coalesce((
      select json_agg(json_build_object('source', user_a, 'target', user_b))
      from public.connections), '[]'::json)
  );
$$;

-- What a logged-out person sees after scanning a QR code.
create function public.public_card(uid uuid)
returns table (name text, avatar_url text)
language sql stable security definer set search_path = '' as $$
  select name, avatar_url from public.profiles where id = uid;
$$;

revoke execute on function public.set_note(uuid, text)  from public, anon;
revoke execute on function public.connect(uuid, text)   from public, anon;
revoke execute on function public.event_graph()         from public, anon;
revoke execute on function public.public_card(uuid)     from public;
grant  execute on function public.set_note(uuid, text)  to authenticated;
grant  execute on function public.connect(uuid, text)   to authenticated;
grant  execute on function public.event_graph()         to authenticated;
grant  execute on function public.public_card(uuid)     to anon, authenticated;
