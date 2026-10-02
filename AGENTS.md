# EduVerse Project Guidelines

## UI/UX & Design Language (Aturan Paten)
1. **Pertahankan Bahasa Desain yang Ada**:
   - Pertahankan estetika yang sudah nyaman dan bersih di EduVerse (Electric Blue `#3B66F5`, slate neuters, cards `rounded-2xl`, borders `border-slate-200`, subtle shadows).
   - Selalu ikuti panduan lengkap di [STANDAR_DESAIN_EDUVERSE.md](file:///c:/Users/adliz/Documents/EduVerse/eduverse-portal/STANDAR_DESAIN_EDUVERSE.md).
2. **Tidak Banyak Ikon (Minimalis Ikon)**:
   - Hindari menjejali tampilan dengan terlalu banyak ikon. Gunakan ikon secukupnya hanya pada aksi penting atau navigasi utama agar tidak berisik secara visual.
3. **Teks Singkat dan Jelas**:
   - Gunakan kata-kata yang ringkas, padat, dan langsung pada intinya (hindari kalimat panjang yang memenuhi tampilan).
4. **Alur Cepat & Responsif**:
   - Prioritaskan kemudahan guru dan murid dalam mengakses informasi, mengklik tautan, dan mengumpulkan data tanpa langkah berbelit.
5. **Offline-First & Durabilitas**:
   - Prioritaskan IndexedDB lokal dengan `navigator.storage.persist()`.
   - Media selalu ke Cloudflare R2 (`https://pub-4e88ac579a704dc4967076cfd4f4139f.r2.dev`).
   - Notifikasi PWA harus berbentuk *slim pill* (44px), tidak boleh memblokir layar.
