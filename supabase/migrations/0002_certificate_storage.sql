-- Restore the private certificate bucket and its administrator-only policy.
-- Safe to run repeatedly after 0001_portfolio.sql.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificate-files',
  'certificate-files',
  false,
  8388608,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin manages certificate files" on storage.objects;
create policy "admin manages certificate files"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'certificate-files'
  and (select public.is_portfolio_admin())
)
with check (
  bucket_id = 'certificate-files'
  and (select public.is_portfolio_admin())
);
