-- ==============================================================================
-- SCRIPT INSERT 25 SOAL ASAT INFORMATIKA KELAS X KE BANK SOAL EDUVERSE
-- Jalankan script ini di Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

DO $$
DECLARE
    v_teacher_id UUID;
    v_category_parent_id UUID;
    v_category_id UUID;
    v_q_id UUID;
BEGIN
    -- 1. Ambil teacher_id (otomatis memilih akun guru 'adlizers24@gmail.com' atau akun pertama di profiles)
    SELECT id INTO v_teacher_id 
    FROM public.profiles 
    WHERE email = 'adlizers24@gmail.com' 
    LIMIT 1;

    IF v_teacher_id IS NULL THEN
        SELECT id INTO v_teacher_id FROM public.profiles LIMIT 1;
    END IF;

    IF v_teacher_id IS NULL THEN
        RAISE EXCEPTION 'Tidak ditemukan akun guru di tabel profiles.';
    END IF;

    -- 2. Buat / Cari Kategori Utama: Informatika
    SELECT id INTO v_category_parent_id 
    FROM public.categories 
    WHERE teacher_id = v_teacher_id AND name = 'Informatika' AND parent_id IS NULL 
    LIMIT 1;

    IF v_category_parent_id IS NULL THEN
        INSERT INTO public.categories (name, teacher_id, parent_id, school_id)
        VALUES ('Informatika', v_teacher_id, NULL, NULL)
        RETURNING id INTO v_category_parent_id;
    END IF;

    -- 3. Buat / Cari Sub-kategori: ASAT Informatika Kelas X
    SELECT id INTO v_category_id 
    FROM public.categories 
    WHERE teacher_id = v_teacher_id AND name = 'ASAT Informatika Kelas X' AND parent_id = v_category_parent_id 
    LIMIT 1;

    IF v_category_id IS NULL THEN
        INSERT INTO public.categories (name, teacher_id, parent_id, school_id)
        VALUES ('ASAT Informatika Kelas X', v_teacher_id, v_category_parent_id, NULL)
        RETURNING id INTO v_category_id;
    END IF;

    -- SOAL 1
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Naumi ingin membuat sistem otomatisasi untuk menyortir buah mangga berdasarkan ukurannya (Kecil, Sedang, Besar). Sebelum membuat program atau membeli sensor, Naumi mencatat karakteristik berat dan diameter dari 50 sampel mangga yang ada. Kegiatan Naumi mengelompokkan data mangga ini menerapkan prinsip Berpikir Komputasional, yaitu...', 'pilihan_ganda', 'B', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Dekomposisi', NULL),
    (v_q_id, 'B', 'Pengenalan Pola', NULL),
    (v_q_id, 'C', 'Abstraksi', NULL),
    (v_q_id, 'D', 'Perancangan Algoritma', NULL),
    (v_q_id, 'E', 'Pencarian', NULL);

    -- SOAL 2
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Budi sedang merancang sebuah aplikasi mobile untuk perpustakaan sekolah. Ia memutuskan untuk fokus pada fitur pencarian buku, peminjaman, dan pengembalian, sementara fitur seperti warna latar belakang aplikasi atau biografi lengkap penulis buku diabaikan terlebih dahulu pada tahap awal ini. Prinsip yang digunakan Budi adalah...', 'pilihan_ganda', 'C', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Dekomposisi', NULL),
    (v_q_id, 'B', 'Pengenalan Pola', NULL),
    (v_q_id, 'C', 'Abstraksi', NULL),
    (v_q_id, 'D', 'Algoritma', NULL),
    (v_q_id, 'E', 'Pencarian', NULL);

    -- SOAL 3
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Struktur data yang menerapkan prinsip First In, First Out (FIFO), di mana data yang pertama kali masuk akan menjadi data yang pertama kali keluar, disebut...', 'pilihan_ganda', 'B', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Stack (Tumpukan)', NULL),
    (v_q_id, 'B', 'Queue (Antrean)', NULL),
    (v_q_id, 'C', 'Tree (Pohon)', NULL),
    (v_q_id, 'D', 'Graph (Graf)', NULL),
    (v_q_id, 'E', 'Table (Tabel)', NULL);

    -- SOAL 4
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Manakah dari pilihan berikut yang merupakan urutan logis dari tahapan penyelesaian masalah menggunakan Berpikir Komputasional?', 'pilihan_ganda', 'B', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Abstraksi - Dekomposisi - Pengenalan Pola – Algoritma', NULL),
    (v_q_id, 'B', 'Dekomposisi - Pengenalan Pola - Abstraksi – Algoritma', NULL),
    (v_q_id, 'C', 'Algoritma - Abstraksi - Dekomposisi - Pengenalan Pola', NULL),
    (v_q_id, 'D', 'Pengenalan Pola - Dekomposisi - Algoritma – Abstraksi', NULL),
    (v_q_id, 'E', 'Algoritma - Dekomposisi - Pengenalan Pola – Abstraksi', NULL);

    -- SOAL 5
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Sebuah gudang e-commerce menggunakan robot otomatis untuk mengambil barang. Robot tersebut membaca tumpukan kardus baju yang disusun ke atas. Ketika ada pesanan baru, robot selalu mengambil kardus yang berada di posisi paling atas terlebih dahulu. Jika kardus A dimasukkan pertama, lalu kardus B, dan terakhir kardus C, maka urutan keluar kardus dan struktur data yang digunakan adalah...', 'pilihan_ganda', 'B', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'A, B, C dengan struktur Queue', NULL),
    (v_q_id, 'B', 'C, B, A dengan struktur Stack', NULL),
    (v_q_id, 'C', 'C, B, A dengan struktur Queue', NULL),
    (v_q_id, 'D', 'A, B, C dengan struktur Stack', NULL),
    (v_q_id, 'E', 'B, A, C dengan struktur Stack', NULL);

    -- SOAL 6
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Andi diminta memperbaiki komputer laboratorium yang mati total. Langkah pertama yang ia lakukan adalah memeriksa kabel daya, kemudian memeriksa power supply, lalu memeriksa motherboard, hingga akhirnya menemukan komponen yang rusak. Proses memecah masalah besar (komputer mati) menjadi diagnosis komponen-komponen kecil ini disebut...', 'pilihan_ganda', 'C', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Algoritma', NULL),
    (v_q_id, 'B', 'Abstraksi', NULL),
    (v_q_id, 'C', 'Dekomposisi', NULL),
    (v_q_id, 'D', 'Evaluasi', NULL),
    (v_q_id, 'E', 'Pengenalan Pola', NULL);

    -- SOAL 7
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Dinda ingin mencari satu buku spesifik dengan judul "Laskar Pelangi" di rak perpustakaan yang berisi 100 buku. Buku-buku tersebut ternyata sudah disusun rapi berdasarkan alfabet judulnya. Dinda memutuskan menggunakan metode Binary Search untuk mempercepat pencarian. Jika posisi buku yang dicari tepat berada di urutan ke-25, berapa kali maksimal perbandingan yang harus dilakukan Dinda hingga menemukan buku tersebut?', 'pilihan_ganda', 'A', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', '2', NULL),
    (v_q_id, 'B', '3', NULL),
    (v_q_id, 'C', '4', NULL),
    (v_q_id, 'D', '5', NULL),
    (v_q_id, 'E', '6', NULL);

    -- SOAL 8
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Di dalam sebuah aplikasi pengolah data absen, terdapat daftar 300 nama siswa. Sayangnya, data tersebut rusak sehingga urutan namanya menjadi sepenuhnya acak dan tidak berurutan berdasarkan abjad. Jika operator ingin mencari keberadaan nama "Siti" di dalam daftar tersebut, algoritma pencarian apa yang secara teknis harus ia gunakan?', 'pilihan_ganda', 'E', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Binary Search', NULL),
    (v_q_id, 'B', 'Insertion Search', NULL),
    (v_q_id, 'C', 'Bubble Search', NULL),
    (v_q_id, 'D', 'Selection Search', NULL),
    (v_q_id, 'E', 'Linier Search', NULL);

    -- SOAL 9
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Komponen tersebut merupakan unit pemroses utama untuk mengeksekusi instruksi data dan sering disebut sebagai "otak" dari komputer. Nama perangkat keras ini adalah...', 'pilihan_ganda', 'D', v_category_id, '/images/soal/image1.jpeg')
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'SSD', NULL),
    (v_q_id, 'B', 'RAM', NULL),
    (v_q_id, 'C', 'VGA', NULL),
    (v_q_id, 'D', 'Processor', NULL),
    (v_q_id, 'E', 'Motherboard', NULL);

    -- SOAL 10
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Saat Siska sedang mengetik tugas makalah, ia selalu menggunakan keyboard dan mouse yang sepenuhnya berfungsi sebagai...', 'pilihan_ganda', 'C', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Perangkat Keluaran (Output Device)', NULL),
    (v_q_id, 'B', 'Perangkat Penyimpanan (Storage Device)', NULL),
    (v_q_id, 'C', 'Perangkat Masukan (Input Device)', NULL),
    (v_q_id, 'D', 'Perangkat Pemrosesan (Processing Device)', NULL),
    (v_q_id, 'E', 'Perangkat Penyuntingan (Editing Device)', NULL);

    -- SOAL 11
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Andi membeli printer baru, lalu dia menghubungkan printer baru ke laptopnya menggunakan kabel USB. Namun, printer tersebut tidak bisa digunakan untuk mencetak dokumen sama sekali. Setelah membaca buku petunjuk, Andi menyadari bahwa laptopnya memerlukan perangkat lunak khusus untuk menerjemahkan perintah cetak agar dimengerti oleh hardware printer tersebut. Jenis perangkat lunak yang dimaksud adalah...', 'pilihan_ganda', 'C', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Operating System', NULL),
    (v_q_id, 'B', 'Application Software', NULL),
    (v_q_id, 'C', 'Device Driver', NULL),
    (v_q_id, 'D', 'Utility Software', NULL),
    (v_q_id, 'E', 'Essential Software', NULL);

    -- SOAL 12
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Device tersebut memiliki fungsi sebagai...', 'pilihan_ganda', 'A', v_category_id, '/images/soal/image2.jpeg')
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Perangkat Input', NULL),
    (v_q_id, 'B', 'Perangkat Lunak', NULL),
    (v_q_id, 'C', 'Perangkat Output', NULL),
    (v_q_id, 'D', 'Perangkat Nirkabel', NULL),
    (v_q_id, 'E', 'Perangkat Fisik', NULL);

    -- SOAL 13
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Sebuah perusahaan ingin membangun sistem jaringan komputer yang aman. Mereka memasang sistem operasi khusus, aplikasi kasir, dan software antivirus untuk melindungi data pelanggan. Komponen-komponen program digital yang tidak memiliki wujud fisik ini dalam sistem komputer disebut...', 'pilihan_ganda', 'B', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Hardware', NULL),
    (v_q_id, 'B', 'Software', NULL),
    (v_q_id, 'C', 'Brainware', NULL),
    (v_q_id, 'D', 'Malware', NULL),
    (v_q_id, 'E', 'Ransomware', NULL);

    -- SOAL 14
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Mana yang merupakan gambar dari RAM (Random Access Memory)?', 'pilihan_ganda', 'C', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Gambar A', '/images/soal/image3.jpeg'),
    (v_q_id, 'B', 'Gambar B', '/images/soal/image5.jpeg'),
    (v_q_id, 'C', 'Gambar C (Modul RAM)', '/images/soal/image7.jpeg'),
    (v_q_id, 'D', 'Gambar D', '/images/soal/image4.jpeg'),
    (v_q_id, 'E', 'Gambar E', '/images/soal/image6.jpeg');

    -- SOAL 15
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Mana yang merupakan gambar dari VGA atau Graphic Card?', 'pilihan_ganda', 'D', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Gambar A', '/images/soal/image4.jpeg'),
    (v_q_id, 'B', 'Gambar B', '/images/soal/image3.jpeg'),
    (v_q_id, 'C', 'Gambar C', '/images/soal/image7.jpeg'),
    (v_q_id, 'D', 'Gambar D (VGA / GPU Card)', '/images/soal/image6.jpeg'),
    (v_q_id, 'E', 'Gambar E', '/images/soal/image5.jpeg');

    -- SOAL 16
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Device berikut memiliki fungsi sebagai...', 'pilihan_ganda', 'D', v_category_id, '/images/soal/image8.jpeg')
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Perangkat Input', NULL),
    (v_q_id, 'B', 'Perangkat Output', NULL),
    (v_q_id, 'C', 'Perangkat Audio', NULL),
    (v_q_id, 'D', 'Perangkat Visual', NULL),
    (v_q_id, 'E', 'Perangkat Audio + Visual', NULL);

    -- SOAL 17
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Budi baru saja merakit sebuah komputer. Ketika komputer tersebut dinyalakan pertama kali, ia belum bisa menginstal aplikasi seperti Microsoft Word, game engine, atau browser internet. Hal ini terjadi karena Budi belum menginstal sebuah perangkat lunak utama yang berfungsi sebagai pengelola seluruh sumber daya perangkat keras dan menjembatani komunikasi antara hardware dengan aplikasi. Perangkat lunak utama yang harus diinstal Budi terlebih dahulu adalah...', 'pilihan_ganda', 'A', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Operating System', NULL),
    (v_q_id, 'B', 'Utility Software', NULL),
    (v_q_id, 'C', 'Driver Device', NULL),
    (v_q_id, 'D', 'Word Processor', NULL),
    (v_q_id, 'E', 'Presentation Processor', NULL);

    -- SOAL 18
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Seorang guru Informatika ingin membuat media pembelajaran interaktif berupa salindia (slide) presentasi yang akan ditampilkan di kelas. Ia juga ingin file tersebut tersimpan secara online agar bisa diedit bersama (kolaborasi) dengan rekan guru lainnya secara real-time. Jenis perangkat lunak aplikasi berbasis cloud yang paling tepat digunakan adalah...', 'pilihan_ganda', 'B', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Google Docs', NULL),
    (v_q_id, 'B', 'Google Slides', NULL),
    (v_q_id, 'C', 'Adobe Photoshop', NULL),
    (v_q_id, 'D', 'Windows Media Player', NULL),
    (v_q_id, 'E', 'Corel Draw', NULL);

    -- SOAL 19
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Rina merasa kesal dengan temannya dan menuliskan kata-kata kasar di status media sosialnya. Lima menit kemudian, ia menyesal dan langsung menghapus status tersebut. Namun, keesokan harinya, Rina dipanggil oleh guru bimbingan konseling karena tangkapan layar (screenshot) status tersebut sudah menyebar luas di grup pesan singkat. Dari kejadian ini, karakteristik utama dari jejak digital (digital footprint) yang paling tepat adalah...', 'pilihan_ganda', 'B', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Jejak digital selalu bisa dihapus secara permanen jika kita menggunakan mode incognito', NULL),
    (v_q_id, 'B', 'Jejak digital bersifat permanen dan sangat sulit dihilangkan begitu terpublikasi di internet', NULL),
    (v_q_id, 'C', 'Jejak digital hanya bisa dilihat oleh orang-orang yang ada di daftar teman media social', NULL),
    (v_q_id, 'D', 'Jejak digital secara otomatis akan hilang dengan sendirinya setelah 24 jam', NULL),
    (v_q_id, 'E', 'Jejak digital tidak akan terekam jika kita mengakses internet menggunakan HP milik orang lain', NULL);

    -- SOAL 20
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Pak guru menerima email yang mengatasnamakan admin sebuah bank. Email tersebut memberitahukan bahwa rekeningnya telah diblokir sementara dan meminta Pak guru untuk segera mengklik sebuah tautan (link) untuk memasukkan username dan password agar rekeningnya aktif kembali. Namun, jika diperhatikan, alamat email pengirimnya adalah "admin-bank@gmail.com". Tindakan paling tepat dan aman yang harus dilakukan adalah...', 'pilihan_ganda', 'D', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Mengklik tautan tersebut dan memasukkan data sandi karena pesannya bersifat mendesak', NULL),
    (v_q_id, 'B', 'Membalas email tersebut dengan melampirkan foto KTP untuk verifikasi resmi', NULL),
    (v_q_id, 'C', 'Meneruskan email tersebut ke rekan guru lainnya agar mereka bisa ikut mengeceknya', NULL),
    (v_q_id, 'D', 'Mengabaikan dan menghapus email tersebut karena merupakan indikasi kejahatan phishing', NULL),
    (v_q_id, 'E', 'Menyimpan email tersebut ke folder ''Penting'' agar bisa dibaca lagi nanti malam', NULL);

    -- SOAL 21
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Sekelompok siswa sedang membuat karya untuk lomba pembuatan film pendek tingkat sekolah. Agar videonya terasa lebih dramatis, mereka memasukkan lagu pop populer dari penyanyi terkenal sebagai musik latar belakang (backsound) tanpa meminta izin atau membeli lisensi. Saat video tersebut diunggah ke platform berbagi video, audionya tiba-tiba dibisukan (muted) oleh sistem. Hal ini terjadi karena siswa tersebut melanggar prinsip...', 'pilihan_ganda', 'A', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Hak Cipta (Copyright)', NULL),
    (v_q_id, 'B', 'Keamanan Digital (Digital Security)', NULL),
    (v_q_id, 'C', 'Hukum ITE', NULL),
    (v_q_id, 'D', 'Etika Digital (Netiquette)', NULL),
    (v_q_id, 'E', 'Privasi Data (Data Privacy)', NULL);

    -- SOAL 22
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Dito diberikan tugas oleh gurunya untuk membuat sebuah esai panjang mengenai sejarah kemerdekaan. Karena malas mencari referensi, Dito meminta bantuan program AI (seperti ChatGPT) untuk menuliskan keseluruhan esai tersebut. Dito langsung menyalin dan mengumpulkan hasilnya persis seperti yang diberikan AI tanpa membaca, menyunting, atau mencantumkan bahwa itu adalah hasil dari AI. Masalah etis utama yang dilakukan oleh Dito adalah...', 'pilihan_ganda', 'B', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Melanggar keamanan siber sekolah', NULL),
    (v_q_id, 'B', 'Melakukan plagiarisme dan melanggar integritas akademik', NULL),
    (v_q_id, 'C', 'Menciptakan hoaks atau disinformasi sejarah', NULL),
    (v_q_id, 'D', 'Melanggar undang-undang perlindungan data pribadi', NULL),
    (v_q_id, 'E', 'Menyebarkan ujaran kebencian (hate speech) di lingkungan sekolah', NULL);

    -- SOAL 23
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Di Indonesia, kita memiliki payung hukum yang secara khusus mengatur tentang penyebaran informasi elektronik, transaksi elektronik, dan penindakan terhadap kejahatan siber (seperti penyebaran hoaks, peretasan, dan pencemaran nama baik di media sosial). Regulasi hukum yang dimaksud adalah...', 'pilihan_ganda', 'C', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'KUHP (Kitab Undang-Undang Hukum Pidana)', NULL),
    (v_q_id, 'B', 'UU Hak Cipta (Undang-Undang Nomor 28 Tahun 2014)', NULL),
    (v_q_id, 'C', 'UU ITE (Undang-Undang Informasi dan Transaksi Elektronik)', NULL),
    (v_q_id, 'D', 'UU KIP (Undang-Undang Keterbukaan Informasi Publik)', NULL),
    (v_q_id, 'E', 'UU Perlindungan Konsumen', NULL);

    -- SOAL 24
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Seorang pengembang sedang merancang aplikasi media pembelajaran interaktif. Awalnya, ia berencana mengintegrasikan layanan dari pihak luar untuk menghadirkan fitur Artificial Intelligence (AI) generatif di dalam aplikasinya. Namun, ia memutuskan untuk menunda fitur AI tersebut dan lebih memprioritaskan fungsi-fungsi inti berjalan secara lokal terlebih dahulu agar aplikasi versi awalnya minim bug dan stabil. Dari sudut pandang keandalan sistem AI, keputusan ini sangat masuk akal karena model AI generatif saat ini masih memiliki kelemahan, yaitu sering kali mengarang fakta atau menghasilkan informasi yang salah namun disajikan dengan gaya bahasa yang sangat meyakinkan. Fenomena kelemahan AI generatif ini dikenal dengan istilah...', 'pilihan_ganda', 'D', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Algorithmic Bias (Bias Algoritma)', NULL),
    (v_q_id, 'B', 'Machine Learning (Pembelajaran Mesin)', NULL),
    (v_q_id, 'C', 'Data Privacy Breach (Pelanggaran Privasi Data)', NULL),
    (v_q_id, 'D', 'AI Hallucination (Halusinasi AI)', NULL),
    (v_q_id, 'E', 'Artificial General Intelligence (AGI)', NULL);

    -- SOAL 25
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id, image_url)
    VALUES (v_teacher_id, 'Seorang siswa mengumpulkan tugas pembuatan aset karakter 2D bergaya chibi untuk proyek pengembangan game di kelas. Namun, guru pengampu mata pelajaran Seni Rupa dan Informatika menyadari ada kejanggalan: gambar tersebut memiliki detail struktur yang asimetris dan pola pewarnaan yang sangat instan, tidak seperti proses menggambar manual lapis demi lapis menggunakan software piksel (seperti Piskel). Setelah dikonfirmasi, siswa tersebut mengaku tidak menggambarnya sendiri, melainkan hanya mengetikkan deskripsi teks (misalnya: "buatkan karakter chibi memakai baju zirah biru") pada sebuah situs web, dan gambar tersebut langsung jadi dalam hitungan detik. Teknologi AI yang digunakan oleh siswa tersebut adalah...', 'pilihan_ganda', 'C', v_category_id, NULL)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text, image_url) VALUES
    (v_q_id, 'A', 'Predictive AI (AI Prediktif)', NULL),
    (v_q_id, 'B', 'Expert System (Sistem Pakar)', NULL),
    (v_q_id, 'C', 'Generative AI (AI Generatif)', NULL),
    (v_q_id, 'D', 'Computer Vision (Visi Komputer)', NULL),
    (v_q_id, 'E', 'Data Mining (Penggalian Data)', NULL);

    RAISE NOTICE 'Berhasil menambahkan 25 soal ASAT Informatika Kelas X ke Bank Soal.';
END $$;
