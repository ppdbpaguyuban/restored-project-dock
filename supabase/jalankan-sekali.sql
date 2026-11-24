-- Jalankan SEKALI di Supabase > SQL Editor (aman diulang). Isinya:
-- 1) kolom baru formulir 4 tahap, 2) id gelombang, 3) tolak NISN ganda per tahun ajaran,
-- 4) izin panitia menambah pendaftar dari tombol "Tambah Pendaftar" di Admin,
-- 5) tempat simpan berkas pendaftar (privat) & aset logo/galeri (publik), 6) tahun ajaran 2027/2028.
alter table public.pendaftar add column if not exists jenis_kelamin text;
alter table public.pendaftar add column if not exists agama text;
alter table public.pendaftar add column if not exists kota_sekolah text;
alter table public.pendaftar add column if not exists tahun_lulus text;
alter table public.pendaftar add column if not exists jurusan_2 text;
alter table public.pendaftar add column if not exists berkas_kip text;
alter table public.pendaftar add column if not exists gelombang_id uuid;

do $$ begin
  create unique index if not exists pendaftar_nisn_ta_key on public.pendaftar (nisn, tahun_ajaran);
exception when unique_violation then
  raise notice 'Ada NISN ganda di tahun ajaran yang sama; hapus data gandanya lalu jalankan file ini lagi.';
end $$;

drop policy if exists "pendaftar ditambah pengelola" on public.pendaftar;
create policy "pendaftar ditambah pengelola" on public.pendaftar for insert to authenticated
  with check (exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));
grant insert on public.pendaftar to authenticated;

-- Tempat simpan berkas pendaftar (privat) dan aset logo/galeri (publik)
insert into storage.buckets (id, name, public) values ('berkas', 'berkas', false) on conflict (id) do update set public = false;
insert into storage.buckets (id, name, public) values ('aset', 'aset', true) on conflict (id) do update set public = true;
drop policy if exists "berkas diunggah pendaftar" on storage.objects;
create policy "berkas diunggah pendaftar" on storage.objects for insert to anon, authenticated with check (bucket_id = 'berkas');
drop policy if exists "berkas dibaca pengelola" on storage.objects;
create policy "berkas dibaca pengelola" on storage.objects for select to authenticated
  using (bucket_id = 'berkas' and exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));
drop policy if exists "berkas dihapus pengelola" on storage.objects;
create policy "berkas dihapus pengelola" on storage.objects for delete to authenticated
  using (bucket_id = 'berkas' and exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));
drop policy if exists "aset dibaca publik" on storage.objects;
create policy "aset dibaca publik" on storage.objects for select using (bucket_id = 'aset');
drop policy if exists "aset dikelola pengelola" on storage.objects;
create policy "aset dikelola pengelola" on storage.objects for all to authenticated
  using (bucket_id = 'aset' and exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')))
  with check (bucket_id = 'aset' and exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));

-- Tahun ajaran aktif
insert into public.tahun_ajaran (nama) values ('2027/2028') on conflict (nama) do nothing;

notify pgrst, 'reload schema';
