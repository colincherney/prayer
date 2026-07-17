-- Groups: join a church (or any circle) publicly or with an invite code.
-- Prayers can be shared to a group; only members can read them. Everyone
-- stays an anonymous UUID — membership never exposes a name, it only
-- guarantees "the people praying for me are from my circle".

-- ---------- tables ----------
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  description text check (char_length(description) <= 240),
  is_public boolean not null default false,
  -- Private groups carry a shareable join code; public groups have none.
  invite_code text unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_idx on group_members(user_id);

-- If a group is ever deleted, its prayers must die with it. "set null"
-- would strip the group_id and quietly drop private prayers into the
-- public feed — cascade is the privacy-safe choice.
alter table prayers
  add column if not exists group_id uuid;
alter table prayers
  drop constraint if exists prayers_group_id_fkey;
alter table prayers
  add constraint prayers_group_id_fkey
  foreign key (group_id) references groups(id) on delete cascade;

create index if not exists prayers_group_idx
  on prayers(group_id)
  where group_id is not null;

-- ---------- helpers ----------
-- Security definer so policies can check membership without recursive RLS.
create or replace function is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

-- ---------- RLS ----------
alter table groups enable row level security;
alter table group_members enable row level security;

-- Public groups are browsable by anyone signed in; private groups are
-- visible to members only. invite_code rides along for members — sharing
-- the code IS the invite flow, so members may see it.
drop policy if exists "groups visible" on groups;
create policy "groups visible"
  on groups for select
  using (is_public or is_group_member(id));

-- Membership rows are visible when the group itself is visible. Rows only
-- carry opaque anonymous UUIDs; the client uses them for member counts.
drop policy if exists "group members visible" on group_members;
create policy "group members visible"
  on group_members for select
  using (
    user_id = auth.uid()
    or is_group_member(group_id)
    or exists (select 1 from groups g where g.id = group_id and g.is_public)
  );

-- Leaving a group. Owners can't leave (they'd orphan it).
drop policy if exists "group members self delete" on group_members;
create policy "group members self delete"
  on group_members for delete
  using (user_id = auth.uid() and role <> 'owner');

-- Group prayers are members-only, no matter what other permissive policies
-- exist on prayers. RESTRICTIVE = ANDed with everything else. The author
-- always keeps sight of their own prayer, even after leaving the group.
drop policy if exists "group prayers members only" on prayers;
create policy "group prayers members only"
  on prayers as restrictive for select
  using (
    group_id is null
    or user_id = auth.uid()
    or is_group_member(group_id)
  );

-- ---------- RPCs ----------
-- All writes to groups/group_members go through these so the client never
-- needs insert policies and invite codes are validated server-side.

-- Unambiguous alphabet: no 0/O/1/I.
create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return code;
end;
$$;

create or replace function create_group(
  p_name text,
  p_description text default null,
  p_is_public boolean default false
)
returns table (id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_desc text := nullif(trim(coalesce(p_description, '')), '');
  v_code text;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if char_length(v_name) < 3 or char_length(v_name) > 60 then
    raise exception 'invalid_name';
  end if;

  if not p_is_public then
    -- Retry on the (unlikely) collision with an existing code.
    loop
      v_code := generate_invite_code();
      exit when not exists (select 1 from groups g where g.invite_code = v_code);
    end loop;
  end if;

  insert into groups (name, description, is_public, invite_code, created_by)
  values (v_name, v_desc, p_is_public, v_code, auth.uid())
  returning groups.id into v_id;

  insert into group_members (group_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  return query select v_id, v_code;
end;
$$;

-- Join either a public group by id, or a private group by invite code.
create or replace function join_group(
  p_group_id uuid default null,
  p_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;

  if p_code is not null then
    select g.id into v_id
    from groups g
    where g.invite_code = upper(trim(p_code));
    if v_id is null then
      raise exception 'invalid_code';
    end if;
  elsif p_group_id is not null then
    select g.id into v_id
    from groups g
    where g.id = p_group_id and g.is_public;
    if v_id is null then
      raise exception 'not_found';
    end if;
  else
    raise exception 'missing_argument';
  end if;

  insert into group_members (group_id, user_id)
  values (v_id, auth.uid())
  on conflict (group_id, user_id) do nothing;

  return v_id;
end;
$$;
