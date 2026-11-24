-- Jalankan di Supabase > SQL Editor (aman dijalankan ulang berkali-kali)
create table if not exists public.faq (id uuid primary key default gen_random_uuid(), pertanyaan text not null, jawaban text not null, urutan int not null default 0, created_at timestamptz default now());
create table if not exists public.tahun_ajaran (id uuid primary key default gen_random_uuid(), nama text unique not null, created_at timestamptz default now());
create table if not exists public.pengelola (id uuid primary key default gen_random_uuid(), email text unique not null, nama text, aktif boolean not null default true, created_at timestamptz default now());
grant select on public.faq, public.tahun_ajaran to anon;
grant all on public.faq, public.tahun_ajaran, public.pengelola to authenticated, service_role;
alter table public.faq enable row level security;
alter table public.tahun_ajaran enable row level security;
alter table public.pengelola enable row level security;
drop policy if exists "faq baca" on public.faq;
create policy "faq baca" on public.faq for select to anon, authenticated using (true);
drop policy if exists "faq kelola" on public.faq;
create policy "faq kelola" on public.faq for all to authenticated using (true) with check (true);
drop policy if exists "ta baca" on public.tahun_ajaran;
create policy "ta baca" on public.tahun_ajaran for select to anon, authenticated using (true);
drop policy if exists "ta kelola" on public.tahun_ajaran;
create policy "ta kelola" on public.tahun_ajaran for all to authenticated using (true) with check (true);
drop policy if exists "pengelola kelola" on public.pengelola;
create policy "pengelola kelola" on public.pengelola for all to authenticated using (true) with check (true);

-- Tambahan: mode upload dokumen & verifikasi petugas
alter table public.pengaturan_ppdb add column if not exists wajib_berkas boolean not null default true;
alter table public.pendaftar add column if not exists verifikasi jsonb not null default '{}'::jsonb;
alter table public.pendaftar add column if not exists petugas text;
alter table public.pendaftar add column if not exists diverifikasi_at timestamptz;
alter table public.pendaftar alter column berkas_foto drop not null;
alter table public.pendaftar alter column berkas_kk drop not null;
alter table public.pendaftar alter column berkas_akta drop not null;
alter table public.pendaftar alter column berkas_skl drop not null;

-- Tambahan: gelombang & tanggal buka/tutup
create table if not exists public.gelombang (id uuid primary key default gen_random_uuid(), nama text not null, tahun_ajaran text not null, mulai date not null, selesai date not null, created_at timestamptz default now());
grant select on public.gelombang to anon;
grant all on public.gelombang to authenticated, service_role;
alter table public.gelombang enable row level security;
drop policy if exists "gel baca" on public.gelombang;
create policy "gel baca" on public.gelombang for select to anon, authenticated using (true);
drop policy if exists "gel kelola" on public.gelombang;
create policy "gel kelola" on public.gelombang for all to authenticated using (true) with check (true);
alter table public.pendaftar add column if not exists gelombang text;


-- Tambahan: profil sekolah (alamat, kontak, maps) & pengumuman
alter table public.pengaturan_ppdb add column if not exists alamat text;
alter table public.pengaturan_ppdb add column if not exists telepon text;
alter table public.pengaturan_ppdb add column if not exists email text;
alter table public.pengaturan_ppdb add column if not exists maps_url text;
alter table public.pengaturan_ppdb add column if not exists pengumuman text;

-- Logo & foto galeri (tab Admin "Logo & Galeri")
alter table public.pengaturan_ppdb add column if not exists logo_url text;
alter table public.pengaturan_ppdb add column if not exists header_url text;
alter table public.pengaturan_ppdb add column if not exists foto_tkr text;
alter table public.pengaturan_ppdb add column if not exists foto_tsm text;
alter table public.pengaturan_ppdb add column if not exists foto_totr text;
alter table public.pengaturan_ppdb add column if not exists foto_rpl text;
alter table public.pengaturan_ppdb add column if not exists foto_bdf text;
insert into storage.buckets (id, name, public) values ('aset', 'aset', true) on conflict (id) do update set public = true;
drop policy if exists "aset dibaca publik" on storage.objects;
create policy "aset dibaca publik" on storage.objects for select using (bucket_id = 'aset');
drop policy if exists "aset dikelola pengelola" on storage.objects;
create policy "aset dikelola pengelola" on storage.objects for all to authenticated
  using (bucket_id = 'aset' and exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')))
  with check (bucket_id = 'aset' and exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));

-- Catatan petugas verifikasi
alter table public.pendaftar add column if not exists catatan text;

-- Riwayat audit pendaftar (otomatis dicatat saat status/catatan/checklist berubah)
create table if not exists public.pendaftar_riwayat (
  id uuid primary key default gen_random_uuid(),
  pendaftar_id uuid not null,
  oleh text,
  aksi text not null,
  dari text,
  ke text,
  created_at timestamptz not null default now()
);
create index if not exists pendaftar_riwayat_pid on public.pendaftar_riwayat (pendaftar_id, created_at desc);
grant select on public.pendaftar_riwayat to authenticated;
grant all on public.pendaftar_riwayat to service_role;
alter table public.pendaftar_riwayat enable row level security;
drop policy if exists "riwayat dibaca pengelola" on public.pendaftar_riwayat;
create policy "riwayat dibaca pengelola" on public.pendaftar_riwayat for select to authenticated
  using (exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));

create or replace function public.catat_riwayat_pendaftar() returns trigger
language plpgsql security definer set search_path = public as $$
declare siapa text := coalesce(nullif(auth.jwt()->>'email', ''), 'sistem');
begin
  if coalesce(old.status, 'baru') is distinct from coalesce(new.status, 'baru') then
    insert into public.pendaftar_riwayat (pendaftar_id, oleh, aksi, dari, ke) values (new.id, siapa, 'status', coalesce(old.status, 'baru'), coalesce(new.status, 'baru'));
  end if;
  if old.catatan is distinct from new.catatan then
    insert into public.pendaftar_riwayat (pendaftar_id, oleh, aksi, dari, ke) values (new.id, siapa, 'catatan', old.catatan, new.catatan);
  end if;
  if old.verifikasi is distinct from new.verifikasi then
    insert into public.pendaftar_riwayat (pendaftar_id, oleh, aksi, dari, ke) values (new.id, siapa, 'checklist',
      (select count(*)::text from jsonb_each(coalesce(old.verifikasi, '{}'::jsonb)) where value = 'true'::jsonb),
      (select count(*)::text from jsonb_each(coalesce(new.verifikasi, '{}'::jsonb)) where value = 'true'::jsonb));
  end if;
  return new;
end $$;
drop trigger if exists trg_riwayat_pendaftar on public.pendaftar;
create trigger trg_riwayat_pendaftar after update on public.pendaftar for each row execute function public.catat_riwayat_pendaftar();

-- Nomor pendaftaran (ditampilkan di halaman konfirmasi calon siswa)
alter table public.pendaftar add column if not exists no_daftar text;
create unique index if not exists pendaftar_no_daftar_key on public.pendaftar (no_daftar) where no_daftar is not null;

-- gelombang: status & urutan tampil di beranda
alter table public.gelombang add column if not exists urutan int;
alter table public.gelombang add column if not exists status text not null default 'otomatis';
alter table public.gelombang drop constraint if exists gelombang_status_check;
alter table public.gelombang add constraint gelombang_status_check check (status in ('otomatis', 'ditutup', 'sembunyi'));

-- Cek status pendaftaran oleh calon siswa (halaman /lacak).
-- Hanya mengembalikan satu baris bila nomor pendaftaran DAN tanggal lahir cocok; catatan petugas, NISN, HP, alamat, dan berkas tidak ikut.
create or replace function public.lacak_pendaftaran(p_no text, p_tgl date)
returns table (no_daftar text, nama text, jurusan text, gelombang text, tahun_ajaran text, status text, verifikasi jsonb, didaftar_at timestamptz, diverifikasi_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.no_daftar, p.nama, p.jurusan, p.gelombang, p.tahun_ajaran, coalesce(p.status, 'baru'), coalesce(p.verifikasi, '{}'::jsonb), p.created_at, p.diverifikasi_at
  from public.pendaftar p
  where p.no_daftar is not null
    and upper(p.no_daftar) = upper(trim(p_no))
    and p.tanggal_lahir::date = p_tgl
  limit 1;
$$;
revoke all on function public.lacak_pendaftaran(text, date) from public;
grant execute on function public.lacak_pendaftaran(text, date) to anon, authenticated;


-- Penyimpanan berkas pendaftar (privat): pendaftar boleh unggah, hanya pengelola boleh baca/hapus
insert into storage.buckets (id, name, public) values ('berkas', 'berkas', false) on conflict (id) do update set public = false;
drop policy if exists "berkas diunggah pendaftar" on storage.objects;
create policy "berkas diunggah pendaftar" on storage.objects for insert to anon, authenticated with check (bucket_id = 'berkas');
drop policy if exists "berkas dibaca pengelola" on storage.objects;
create policy "berkas dibaca pengelola" on storage.objects for select to authenticated
  using (bucket_id = 'berkas' and exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));
drop policy if exists "berkas dihapus pengelola" on storage.objects;
create policy "berkas dihapus pengelola" on storage.objects for delete to authenticated
  using (bucket_id = 'berkas' and exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));

-- Syarat pendaftaran (tab Admin "Syarat"), satu syarat per baris
alter table public.pengaturan_ppdb add column if not exists syarat text;

-- Daftar ulang (tab Admin "Daftar Ulang"): rincian biaya & status bayar, tampil di Cek Status
alter table public.pendaftar add column if not exists daftar_ulang jsonb;
drop function if exists public.lacak_pendaftaran(text, date);
create function public.lacak_pendaftaran(p_no text, p_tgl date)
returns table (no_daftar text, nama text, jurusan text, gelombang text, tahun_ajaran text, status text, verifikasi jsonb, didaftar_at timestamptz, diverifikasi_at timestamptz, daftar_ulang jsonb)
language sql stable security definer set search_path = public as $$
  select p.no_daftar, p.nama, p.jurusan, p.gelombang, p.tahun_ajaran, coalesce(p.status, 'baru'), coalesce(p.verifikasi, '{}'::jsonb), p.created_at, p.diverifikasi_at,
    case when p.status = 'diterima' then p.daftar_ulang else null end
  from public.pendaftar p
  where p.no_daftar is not null
    and upper(p.no_daftar) = upper(trim(p_no))
    and p.tanggal_lahir::date = p_tgl
  limit 1;
$$;
revoke all on function public.lacak_pendaftaran(text, date) from public;
grant execute on function public.lacak_pendaftaran(text, date) to anon, authenticated;

-- Formulir pendaftaran 4 tahap: kolom data diri, sekolah, jurusan pilihan 2, dan berkas KIP
alter table public.pendaftar add column if not exists jenis_kelamin text;
alter table public.pendaftar add column if not exists agama text;
alter table public.pendaftar add column if not exists kota_sekolah text;
alter table public.pendaftar add column if not exists tahun_lulus text;
alter table public.pendaftar add column if not exists jurusan_2 text;
alter table public.pendaftar add column if not exists berkas_kip text;
notify pgrst, 'reload schema';

-- Pengiriman formulir: simpan id gelombang yang dibuka saat mendaftar, dan tolak NISN ganda dalam satu tahun ajaran
alter table public.pendaftar add column if not exists gelombang_id uuid;
do $$ begin
  create unique index if not exists pendaftar_nisn_ta_key on public.pendaftar (nisn, tahun_ajaran);
exception when unique_violation then
  raise notice 'Ada NISN ganda di tahun ajaran yang sama; hapus data gandanya lalu jalankan bagian ini lagi.';
end $$;
notify pgrst, 'reload schema';

-- Admin "Tambah Pendaftar": pengelola yang sedang login boleh menambah pendaftar (calon siswa datang langsung)
drop policy if exists "pendaftar ditambah pengelola" on public.pendaftar;
create policy "pendaftar ditambah pengelola" on public.pendaftar for insert to authenticated
  with check (exists (select 1 from public.pengelola p where lower(p.email) = lower(auth.jwt()->>'email')));
grant insert on public.pendaftar to authenticated;
notify pgrst, 'reload schema';

-- Daftar ulang: status bayar selalu mengikuti nominal "Sudah dibayar" (aman dijalankan ulang).
-- dibayar <= 0 -> belum, 0 < dibayar < total -> cicil, dibayar >= total -> lunas. Nominal negatif dijadikan 0.
create or replace function public.total_daftar_ulang(d jsonb) returns numeric
language sql immutable set search_path = public as $$
  select coalesce(sum(greatest(0, case when jsonb_typeof(i->'nominal') = 'number' then (i->>'nominal')::numeric else 0 end)), 0)
  from jsonb_array_elements(case when jsonb_typeof(d->'items') = 'array' then d->'items' else '[]'::jsonb end) i;
$$;
create or replace function public.dibayar_daftar_ulang(d jsonb) returns numeric
language sql immutable set search_path = public as $$
  select greatest(0, coalesce(case when jsonb_typeof(d->'dibayar') = 'number' then round((d->>'dibayar')::numeric) end, 0));
$$;
create or replace function public.sinkron_daftar_ulang(d jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select case when d is null or jsonb_typeof(d) <> 'object' then d else
    d || jsonb_build_object('dibayar', public.dibayar_daftar_ulang(d), 'status_bayar',
      case when public.dibayar_daftar_ulang(d) <= 0 then 'belum'
           when public.dibayar_daftar_ulang(d) < public.total_daftar_ulang(d) then 'cicil'
           else 'lunas' end)
  end;
$$;
create or replace function public.trg_sinkron_daftar_ulang() returns trigger
language plpgsql set search_path = public as $$
begin
  new.daftar_ulang := public.sinkron_daftar_ulang(new.daftar_ulang);
  return new;
end $$;
drop trigger if exists trg_sinkron_daftar_ulang on public.pendaftar;
create trigger trg_sinkron_daftar_ulang before insert or update of daftar_ulang on public.pendaftar
  for each row execute function public.trg_sinkron_daftar_ulang();
-- Rapikan data lama. Yang dulu ditandai Lunas tanpa nominal lengkap tetap Lunas (nominal diisi sebesar total).
update public.pendaftar set daftar_ulang = public.sinkron_daftar_ulang(
    case when daftar_ulang->>'status_bayar' = 'lunas' and public.dibayar_daftar_ulang(daftar_ulang) < public.total_daftar_ulang(daftar_ulang)
      then daftar_ulang || jsonb_build_object('dibayar', public.total_daftar_ulang(daftar_ulang)) else daftar_ulang end)
  where daftar_ulang is not null and jsonb_typeof(daftar_ulang) = 'object';
