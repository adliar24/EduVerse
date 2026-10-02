# Standar Desain & Pedoman UI/UX EduVerse (Buku Panduan Resmi)

Dokumen ini adalah **pedoman paten** desain dan arsitektur visual untuk seluruh pengembang, kontributor, dan asisten AI agar tampilan aplikasi EduVerse selalu konsisten, elegan, dan profesional tanpa perlu mengulang instruksi.

---

## 1. Palet Warna & Identitas Merek

| Peran Warna | Kode Warna / Tailwind | Penggunaan |
| :--- | :--- | :--- |
| **Primary Brand** | `#3B66F5` (`blue-600`) | Tombol aksi utama, tab aktif, link utama, branding EduVerse |
| **Dark Navy Accent**| `#1E293B` / `#0F172A` (`slate-800`/`900`) | Teks heading, status bar, aksen kontras |
| **Neutral Background** | `#F8FAFC` (`slate-50`) & `#FFFFFF` | Latar belakang halaman dan kartu konten |
| **Borders & Dividers** | `border-slate-200` & `border-slate-100` | Garis pemisah kartu, tabel, dan input |
| **Text Muted** | `text-slate-500` / `text-slate-400` | Keterangan sekunder, metadata tanggal/waktu |

### Gradien Ciri Khas Tombol Cepat Dashboard:
- 🟢 **Presensi / Kehadiran**: `bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white`
- 🔵 **Input Nilai / EduScore**: `bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white`
- 🟠 **Ujian Baru / Evaluasi**: `bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white`

---

## 2. Aturan Struktur Kartu & Modal

1. **Kelengkungan Sudut (Corner Radius)**:
   - Kartu utama & container: `rounded-2xl`
   - Tombol, input teks, & badge: `rounded-xl` atau `rounded-full` (untuk pill status)
2. **Bayangan (Shadow)**:
   - Gunakan bayangan halus modern: `shadow-sm` atau `shadow-md shadow-slate-200/50`
   - Hindari drop shadow pekat/hitam pekat.
3. **Modal & Loading Overlay**:
   - Gunakan gaya *white glassmorphism*: `bg-white/15 backdrop-blur-md border border-white/20` dengan spinner `text-white` agar elegan di atas latar gelap.

---

## 3. Minimalis Ikon (Aturan Anti-Bising Visual)

- **Batasan**: Maksimal 1 ikon per tombol/menu aksi penting.
- **Dilarang**: Menaruh ikon dekoratif di setiap baris tabel atau di samping setiap kata teks.
- **Fungsi Ikon**: Hanya untuk memperjelas konteks (contoh: ikon *Download* pada tombol unduh, ikon *Check* pada status berhasil).

---

## 4. Teks Singkat, Jelas, & Padat (Microcopy)

- Jangan gunakan kalimat panjang atau bertele-tele di antarmuka guru/murid.
- Gunakan frasa langsung pada aksi:
  - ✅ *"Unduh Cadangan"* bukan *"Klik di sini untuk mengunduh seluruh berkas cadangan data Anda"*
  - ✅ *"Tersimpan di Perangkat"* bukan *"Data berhasil disimpan secara lokal pada database browser Anda"*
  - ✅ *"Pulihkan Data"* bukan *"Proses pemulihan data dari berkas cadangan sebelumnya"*

---

## 5. Standar Ketahanan Data & Offline-First

1. **Storage Durability**:
   - Selalu panggil `navigator.storage.persist()` saat aplikasi dimulai agar browser tidak menghapus cache.
2. **Penyimpanan Media**:
   - Seluruh berkas baru diarahkan ke **Cloudflare R2** (`https://pub-4e88ac579a704dc4967076cfd4f4139f.r2.dev`).
3. **PWA (Progressive Web App)**:
   - Notifikasi instalasi harus berbentuk *slim floating pill* (tinggi $\pm$ 44px) di bawah layar, bukan modal popup besar yang mengganggu aktivitas guru mengajar.
