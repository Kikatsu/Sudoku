-- Realtime collaborative Sudoku rooms.

create table if not exists public.collaboration_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  current_game jsonb not null,
  board_version integer not null default 0,
  max_participants integer not null default 5 check (max_participants between 1 and 10),
  status text not null default 'active' check (status in ('active', 'solved', 'closed')),
  solved_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.collaboration_room_members (
  room_id uuid not null references public.collaboration_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null default 'Player',
  auto_agree boolean not null default false,
  selected_cell integer check (selected_cell is null or selected_cell between 0 and 80),
  color_token text not null default '#137466',
  last_seen_at timestamp with time zone not null default now(),
  joined_at timestamp with time zone not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.collaboration_move_proposals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.collaboration_rooms(id) on delete cascade,
  proposer_id uuid not null references public.profiles(id) on delete cascade,
  action jsonb not null,
  board_version integer not null,
  status text not null default 'pending' check (status in ('pending', 'applied', 'rejected', 'stale')),
  created_at timestamp with time zone not null default now(),
  applied_at timestamp with time zone
);

create table if not exists public.collaboration_move_votes (
  proposal_id uuid not null references public.collaboration_move_proposals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  approved boolean not null default true,
  created_at timestamp with time zone not null default now(),
  primary key (proposal_id, user_id)
);

create table if not exists public.collaboration_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.collaboration_rooms(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  display_name text not null default 'Player',
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamp with time zone not null default now()
);

alter table public.collaboration_rooms enable row level security;
alter table public.collaboration_room_members enable row level security;
alter table public.collaboration_move_proposals enable row level security;
alter table public.collaboration_move_votes enable row level security;
alter table public.collaboration_messages enable row level security;

create or replace function public.is_collaboration_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.collaboration_room_members m
    where m.room_id = p_room_id
      and m.user_id = (select auth.uid())
  );
$$;

create index if not exists collaboration_room_members_room_seen_idx
  on public.collaboration_room_members (room_id, last_seen_at desc);
create index if not exists collaboration_move_proposals_room_status_idx
  on public.collaboration_move_proposals (room_id, status, created_at desc);
create index if not exists collaboration_messages_room_created_idx
  on public.collaboration_messages (room_id, created_at desc);

do $$
begin
  alter publication supabase_realtime add table public.collaboration_rooms;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.collaboration_room_members;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.collaboration_move_proposals;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.collaboration_move_votes;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.collaboration_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

drop policy if exists "Collaboration rooms insertable by host" on public.collaboration_rooms;
create policy "Collaboration rooms insertable by host"
  on public.collaboration_rooms
  for insert
  to authenticated
  with check ((select auth.uid()) = host_id);

drop policy if exists "Collaboration rooms readable by members or host" on public.collaboration_rooms;
create policy "Collaboration rooms readable by members or host"
  on public.collaboration_rooms
  for select
  to authenticated
  using (
    (select auth.uid()) = host_id
    or public.is_collaboration_room_member(id)
  );

drop policy if exists "Collaboration members readable by room members" on public.collaboration_room_members;
create policy "Collaboration members readable by room members"
  on public.collaboration_room_members
  for select
  to authenticated
  using (
    exists (
      select 1 from public.collaboration_rooms r
      where r.id = room_id
        and (r.host_id = (select auth.uid()) or public.is_collaboration_room_member(room_id))
    )
  );

drop policy if exists "Collaboration proposals readable by members" on public.collaboration_move_proposals;
create policy "Collaboration proposals readable by members"
  on public.collaboration_move_proposals
  for select
  to authenticated
  using (public.is_collaboration_room_member(room_id));

drop policy if exists "Collaboration votes readable by members" on public.collaboration_move_votes;
create policy "Collaboration votes readable by members"
  on public.collaboration_move_votes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.collaboration_move_proposals p
      where p.id = proposal_id and public.is_collaboration_room_member(p.room_id)
    )
  );

drop policy if exists "Collaboration messages readable by members" on public.collaboration_messages;
create policy "Collaboration messages readable by members"
  on public.collaboration_messages
  for select
  to authenticated
  using (public.is_collaboration_room_member(room_id));

drop policy if exists "Collaboration messages insertable by members" on public.collaboration_messages;
create policy "Collaboration messages insertable by members"
  on public.collaboration_messages
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.is_collaboration_room_member(room_id)
  );

create or replace function public.join_collaboration_room(
  p_room_id uuid,
  p_display_name text,
  p_color_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room collaboration_rooms%rowtype;
  v_active_count integer;
begin
  select * into v_room
  from public.collaboration_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if v_room.status <> 'active' then
    raise exception 'Room is not active';
  end if;

  if exists (
    select 1 from public.collaboration_room_members
    where room_id = p_room_id and user_id = (select auth.uid())
  ) then
    update public.collaboration_room_members
    set display_name = coalesce(nullif(trim(p_display_name), ''), display_name),
        last_seen_at = now()
    where room_id = p_room_id and user_id = (select auth.uid());
    return jsonb_build_object('joined', true);
  end if;

  select count(*) into v_active_count
  from public.collaboration_room_members
  where room_id = p_room_id
    and last_seen_at >= now() - interval '60 seconds';

  if v_active_count >= v_room.max_participants then
    raise exception 'Room is full';
  end if;

  insert into public.collaboration_room_members (room_id, user_id, display_name, color_token)
  values (
    p_room_id,
    (select auth.uid()),
    coalesce(nullif(trim(p_display_name), ''), 'Player'),
    coalesce(nullif(trim(p_color_token), ''), '#137466')
  );

  return jsonb_build_object('joined', true);
end;
$$;

create or replace function public.update_collaboration_presence(
  p_room_id uuid,
  p_selected_cell integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.collaboration_room_members
  set selected_cell = case when p_selected_cell between 0 and 80 then p_selected_cell else null end,
      last_seen_at = now()
  where room_id = p_room_id and user_id = (select auth.uid());

  if not found then
    raise exception 'Not a room member';
  end if;
end;
$$;

create or replace function public.set_collaboration_auto_agree(
  p_room_id uuid,
  p_auto_agree boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.collaboration_room_members
  set auto_agree = coalesce(p_auto_agree, false),
      last_seen_at = now()
  where room_id = p_room_id and user_id = (select auth.uid());

  if not found then
    raise exception 'Not a room member';
  end if;
end;
$$;

create or replace function public.propose_collaboration_move(
  p_room_id uuid,
  p_action jsonb,
  p_board_version integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal_id uuid;
begin
  if not exists (
    select 1 from public.collaboration_room_members
    where room_id = p_room_id and user_id = (select auth.uid())
  ) then
    raise exception 'Not a room member';
  end if;

  if not exists (
    select 1 from public.collaboration_rooms
    where id = p_room_id and status = 'active' and board_version = p_board_version
  ) then
    raise exception 'Room version changed';
  end if;

  insert into public.collaboration_move_proposals (room_id, proposer_id, action, board_version)
  values (p_room_id, (select auth.uid()), p_action, p_board_version)
  returning id into v_proposal_id;

  insert into public.collaboration_move_votes (proposal_id, user_id, approved)
  select v_proposal_id, user_id, true
  from public.collaboration_room_members
  where room_id = p_room_id
    and last_seen_at >= now() - interval '60 seconds'
    and (user_id = (select auth.uid()) or auto_agree = true)
  on conflict (proposal_id, user_id) do update
    set approved = excluded.approved,
        created_at = now();

  return v_proposal_id;
end;
$$;

create or replace function public.vote_collaboration_move(
  p_proposal_id uuid,
  p_approve boolean,
  p_applied_game jsonb,
  p_completed boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.collaboration_move_proposals%rowtype;
  v_room public.collaboration_rooms%rowtype;
  v_active_count integer;
  v_approval_count integer;
  v_threshold integer;
begin
  select * into v_proposal
  from public.collaboration_move_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception 'Proposal not found';
  end if;

  if not exists (
    select 1 from public.collaboration_room_members
    where room_id = v_proposal.room_id and user_id = (select auth.uid())
  ) then
    raise exception 'Not a room member';
  end if;

  select * into v_room
  from public.collaboration_rooms
  where id = v_proposal.room_id
  for update;

  insert into public.collaboration_move_votes (proposal_id, user_id, approved)
  values (p_proposal_id, (select auth.uid()), coalesce(p_approve, true))
  on conflict (proposal_id, user_id) do update
    set approved = excluded.approved,
        created_at = now();

  if v_proposal.status <> 'pending' then
    return jsonb_build_object('status', v_proposal.status);
  end if;

  if v_room.board_version <> v_proposal.board_version or v_room.status <> 'active' then
    update public.collaboration_move_proposals
    set status = 'stale'
    where id = p_proposal_id;
    return jsonb_build_object('status', 'stale');
  end if;

  select greatest(1, count(*)) into v_active_count
  from public.collaboration_room_members
  where room_id = v_proposal.room_id
    and last_seen_at >= now() - interval '60 seconds';

  v_threshold := greatest(1, ceil(v_active_count::numeric / 2.0)::integer);

  select count(*) into v_approval_count
  from public.collaboration_move_votes v
  join public.collaboration_room_members m
    on m.room_id = v_proposal.room_id and m.user_id = v.user_id
  where v.proposal_id = p_proposal_id
    and v.approved = true
    and m.last_seen_at >= now() - interval '60 seconds';

  if v_approval_count >= v_threshold and p_applied_game is not null then
    update public.collaboration_rooms
    set current_game = p_applied_game,
        board_version = board_version + 1,
        status = case when p_completed then 'solved' else status end,
        solved_at = case when p_completed then now() else solved_at end,
        updated_at = now()
    where id = v_proposal.room_id;

    update public.collaboration_move_proposals
    set status = 'applied',
        applied_at = now()
    where id = p_proposal_id;

    update public.collaboration_move_proposals
    set status = 'stale'
    where room_id = v_proposal.room_id
      and status = 'pending'
      and board_version = v_proposal.board_version
      and id <> p_proposal_id;

    return jsonb_build_object('status', 'applied', 'approvals', v_approval_count, 'threshold', v_threshold);
  end if;

  return jsonb_build_object('status', 'pending', 'approvals', v_approval_count, 'threshold', v_threshold);
end;
$$;

revoke execute on function public.is_collaboration_room_member(uuid) from public;
revoke execute on function public.join_collaboration_room(uuid, text, text) from public;
revoke execute on function public.update_collaboration_presence(uuid, integer) from public;
revoke execute on function public.set_collaboration_auto_agree(uuid, boolean) from public;
revoke execute on function public.propose_collaboration_move(uuid, jsonb, integer) from public;
revoke execute on function public.vote_collaboration_move(uuid, boolean, jsonb, boolean) from public;
revoke execute on function public.is_collaboration_room_member(uuid) from anon;
revoke execute on function public.join_collaboration_room(uuid, text, text) from anon;
revoke execute on function public.update_collaboration_presence(uuid, integer) from anon;
revoke execute on function public.set_collaboration_auto_agree(uuid, boolean) from anon;
revoke execute on function public.propose_collaboration_move(uuid, jsonb, integer) from anon;
revoke execute on function public.vote_collaboration_move(uuid, boolean, jsonb, boolean) from anon;

grant execute on function public.is_collaboration_room_member(uuid) to authenticated;
grant execute on function public.join_collaboration_room(uuid, text, text) to authenticated;
grant execute on function public.update_collaboration_presence(uuid, integer) to authenticated;
grant execute on function public.set_collaboration_auto_agree(uuid, boolean) to authenticated;
grant execute on function public.propose_collaboration_move(uuid, jsonb, integer) to authenticated;
grant execute on function public.vote_collaboration_move(uuid, boolean, jsonb, boolean) to authenticated;
