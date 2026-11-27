-- Sicorp Ventas 2.0: initial cloud schema. Apply only to the dedicated Supabase project.
begin;
create table public.sicorp_sale_batches (
  owner_id uuid not null default auth.uid() references auth.users(id),
  id uuid not null,
  store text not null check (length(store) between 1 and 120),
  sold_at timestamptz not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 500),
  created_at timestamptz not null default now(),
  primary key(owner_id,id)
);
create index sicorp_sales_by_date on public.sicorp_sale_batches(owner_id,sold_at desc);
alter table public.sicorp_sale_batches enable row level security;
revoke all on public.sicorp_sale_batches from anon, authenticated;
grant select, insert on public.sicorp_sale_batches to authenticated;
-- Explicit allow-list in immutable (from client) app_metadata. Set via trusted Auth Admin API.
create policy sicorp_sales_read on public.sicorp_sale_batches for select to authenticated
  using ((select auth.uid()) = owner_id and (select auth.jwt()->'app_metadata'->>'sicorp_admin') = 'true');
create policy sicorp_sales_insert on public.sicorp_sale_batches for insert to authenticated
  with check ((select auth.uid()) = owner_id and (select auth.jwt()->'app_metadata'->>'sicorp_admin') = 'true');
-- Evidence files: never expose a public bucket or service-role credentials.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('sicorp-evidence','sicorp-evidence',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy sicorp_evidence_read on storage.objects for select to authenticated
  using (bucket_id = 'sicorp-evidence' and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select auth.jwt()->'app_metadata'->>'sicorp_admin') = 'true');
create policy sicorp_evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'sicorp-evidence' and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select auth.jwt()->'app_metadata'->>'sicorp_admin') = 'true');
commit;
