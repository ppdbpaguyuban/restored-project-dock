-- Isi data PPDB 2027/2028: gelombang, syarat pendaftaran, dan FAQ (berkas, biaya, jadwal ujian).
-- Jalankan di Supabase > SQL Editor. Aman dijalankan ulang: data yang sudah ada tidak digandakan.
-- Setelah itu semua isian bisa diubah lewat panel Admin (tab Gelombang, Syarat, FAQ).

alter table public.pengaturan_ppdb add column if not exists syarat text;
alter table public.gelombang add column if not exists urutan int;
alter table public.gelombang add column if not exists status text;

-- Gelombang 2027/2028
insert into public.gelombang (nama, tahun_ajaran, mulai, selesai, urutan, status)
select v.nama, '2027/2028', v.mulai::date, v.selesai::date, v.urutan, 'otomatis'
from (values
  ('Gelombang 1', '2027-01-05', '2027-02-28', 1),
  ('Gelombang 2', '2027-03-01', '2027-04-30', 2),
  ('Gelombang 3', '2027-05-01', '2027-07-10', 3),
  ('Gelombang 4', '2027-07-11', '2027-08-31', 4)
) as v(nama, mulai, selesai, urutan)
where not exists (select 1 from public.gelombang g where g.tahun_ajaran = '2027/2028' and g.nama = v.nama);

-- Syarat pendaftaran (satu per baris)
update public.pengaturan_ppdb set syarat = E'Lulus atau akan lulus SMP/MTs sederajat tahun 2027\nPas foto berwarna terbaru ukuran 3x4\nFotokopi Kartu Keluarga (KK)\nFotokopi Akta Kelahiran\nSKL atau rapor semester terakhir\nFotokopi KIP/KKS/PKH (bila ada)'
where id = 1;

-- FAQ seputar berkas, biaya, dan jadwal ujian
insert into public.faq (pertanyaan, jawaban, urutan)
select v.q, v.a, v.u
from (values
  ('Berkas apa saja yang perlu disiapkan?', 'Pas foto berwarna, Kartu Keluarga, Akta Kelahiran, serta SKL atau rapor semester terakhir. Bila punya KIP/KKS/PKH, siapkan juga fotokopinya.', 1),
  ('Format dan ukuran berkas apa yang diterima?', 'JPG, PNG, WebP, atau PDF dengan ukuran maksimal 4 MB per berkas. Foto otomatis dikompres agar unggahan lebih cepat.', 2),
  ('Bagaimana jika berkas saya belum lengkap?', 'Anda tetap bisa mendaftar. Panitia akan memeriksa berkas dan menghubungi Anda melalui WhatsApp bila ada yang perlu dilengkapi. Progresnya bisa dilihat di menu Cek Status.', 3),
  ('Apakah pendaftaran dipungut biaya?', 'Pendaftaran online tidak dipungut biaya alias gratis.', 4),
  ('Berapa biaya daftar ulang dan seragam?', 'Rincian biaya daftar ulang, seragam, dan kegiatan disampaikan oleh panitia saat daftar ulang setelah dinyatakan diterima.', 5),
  ('Kapan jadwal tes seleksi?', 'Tes seleksi dilaksanakan sekitar satu minggu setelah setiap gelombang ditutup, pukul 08.00 WIB di SMK Muhammadiyah 1 Paguyangan. Jadwal pastinya diumumkan panitia melalui WhatsApp dan pengumuman di situs ini.', 6),
  ('Apa saja materi tes seleksi?', 'Tes tulis (pengetahuan umum dan minat jurusan) serta wawancara calon siswa dan orang tua.', 7),
  ('Apa yang perlu dibawa saat tes?', 'Bukti nomor pendaftaran, alat tulis, dan berkas asli untuk dicocokkan. Gunakan pakaian rapi dan datang 30 menit sebelum tes dimulai.', 8)
) as v(q, a, u)
where not exists (select 1 from public.faq f where f.pertanyaan = v.q);
