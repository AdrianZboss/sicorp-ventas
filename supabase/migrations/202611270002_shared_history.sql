create table public.sicorp_history (
 owner_id uuid primary key default auth.uid() references auth.users(id),
 revision bigint not null default 0 check (revision>=0),
 records jsonb not null default '{}'::jsonb check(jsonb_typeof(records)='object' and octet_length(records::text)<=2097152),
 updated_at timestamptz not null default now()
);
create table public.sicorp_sync_requests (
 owner_id uuid not null default auth.uid() references auth.users(id),
 request_id uuid not null,
 revision bigint not null,
 payload_hash text not null,
 primary key(owner_id,request_id)
);
alter table public.sicorp_history enable row level security;
alter table public.sicorp_sync_requests enable row level security;
revoke all on public.sicorp_history, public.sicorp_sync_requests from anon, authenticated;
grant select,insert,update on public.sicorp_history to authenticated;
grant select,insert on public.sicorp_sync_requests to authenticated;
create policy sicorp_history_owner on public.sicorp_history for all to authenticated
 using (owner_id=(select auth.uid()) and (select auth.jwt()->'app_metadata'->>'sicorp_admin')='true')
 with check (owner_id=(select auth.uid()) and (select auth.jwt()->'app_metadata'->>'sicorp_admin')='true');
create policy sicorp_requests_owner on public.sicorp_sync_requests for all to authenticated
 using (owner_id=(select auth.uid()) and (select auth.jwt()->'app_metadata'->>'sicorp_admin')='true')
 with check (owner_id=(select auth.uid()) and (select auth.jwt()->'app_metadata'->>'sicorp_admin')='true');
create function public.sicorp_sync_commit(p_expected bigint,p_records jsonb,p_request uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare u uuid := auth.uid(); s public.sicorp_history%rowtype; prev public.sicorp_sync_requests%rowtype;
begin
 if u is null or coalesce(auth.jwt()->'app_metadata'->>'sicorp_admin','') <> 'true' then raise insufficient_privilege; end if;
 if p_expected is null or p_expected<0 or p_request is null or p_records is null or jsonb_typeof(p_records)<>'object' or octet_length(p_records::text)>2097152 then raise exception 'Invalid sync payload'; end if;
 insert into public.sicorp_history(owner_id) values(u) on conflict do nothing;
 select * into strict s from public.sicorp_history where owner_id=u for update;
 select * into prev from public.sicorp_sync_requests where owner_id=u and request_id=p_request;
 if found then
  if prev.payload_hash<>md5(p_records::text) then raise exception 'Request ID reused'; end if;
  return jsonb_build_object('applied',true,'revision',prev.revision);
 end if;
 if s.revision<>p_expected then return jsonb_build_object('applied',false,'revision',s.revision,'records',s.records); end if;
 update public.sicorp_history set records=p_records,revision=s.revision+1,updated_at=now() where owner_id=u;
 insert into public.sicorp_sync_requests(owner_id,request_id,revision,payload_hash) values(u,p_request,s.revision+1,md5(p_records::text));
 return jsonb_build_object('applied',true,'revision',s.revision+1);
end $$;
revoke all on function public.sicorp_sync_commit(bigint,jsonb,uuid) from public,anon;
grant execute on function public.sicorp_sync_commit(bigint,jsonb,uuid) to authenticated;