-- ==============================================================================
-- SCRIPT INSERT 10 SOAL PKWU - KEWIRAUSAHAAN MAKANAN TRADISIONAL KE BANK SOAL
-- Jalankan script ini di Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

DO $$
DECLARE
    v_teacher_id UUID;
    v_category_parent_id UUID;
    v_category_id UUID;
    v_q_id UUID;
BEGIN
    -- 1. Ambil teacher_id (otomatis memilih akun guru utama 'adlizers24@gmail.com' atau akun guru pertama)
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

    -- 2. Buat / Cari Kategori Utama: PKWU
    SELECT id INTO v_category_parent_id 
    FROM public.categories 
    WHERE teacher_id = v_teacher_id AND name = 'PKWU' AND parent_id IS NULL 
    LIMIT 1;

    IF v_category_parent_id IS NULL THEN
        INSERT INTO public.categories (name, teacher_id, parent_id, school_id)
        VALUES ('PKWU', v_teacher_id, NULL, NULL)
        RETURNING id INTO v_category_parent_id;
    END IF;

    -- 3. Buat / Cari Sub-kategori: Kewirausahaan Makanan Tradisional
    SELECT id INTO v_category_id 
    FROM public.categories 
    WHERE teacher_id = v_teacher_id AND name = 'Kewirausahaan Makanan Tradisional' AND parent_id = v_category_parent_id 
    LIMIT 1;

    IF v_category_id IS NULL THEN
        INSERT INTO public.categories (name, teacher_id, parent_id, school_id)
        VALUES ('Kewirausahaan Makanan Tradisional', v_teacher_id, v_category_parent_id, NULL)
        RETURNING id INTO v_category_id;
    END IF;

    -- SOAL 1
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Makanan yang diolah dari bahan baku pangan lokal dengan resep turun-temurun dan menjadi ciri khas suatu daerah disebut...', 'pilihan_ganda', 'B', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Makanan cepat saji (fast food)'),
    (v_q_id, 'B', 'Makanan tradisional / khas daerah'),
    (v_q_id, 'C', 'Makanan kontinental'),
    (v_q_id, 'D', 'Makanan kaleng'),
    (v_q_id, 'E', 'Makanan fungsional impor');

    -- SOAL 2
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Rendang merupakan salah satu contoh makanan tradisional yang terkenal hingga mancanegara. Makanan ini berasal dari daerah...', 'pilihan_ganda', 'B', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Jawa Barat'),
    (v_q_id, 'B', 'Sumatra Barat'),
    (v_q_id, 'C', 'Bali'),
    (v_q_id, 'D', 'Sulawesi Selatan'),
    (v_q_id, 'E', 'Kalimantan Timur');

    -- SOAL 3
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Tahap pertama yang perlu dilakukan oleh seorang wirausahawan sebelum memulai usaha makanan tradisional adalah...', 'pilihan_ganda', 'B', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Menentukan harga jual yang mahal'),
    (v_q_id, 'B', 'Melakukan riset pasar dan mencari ide peluang usaha'),
    (v_q_id, 'C', 'Membuka cabang di banyak tempat sekaligus'),
    (v_q_id, 'D', 'Meminjam modal dalam jumlah sangat besar'),
    (v_q_id, 'E', 'Membeli peralatan memasak paling canggih');

    -- SOAL 4
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Daun pisang sering digunakan sebagai pembungkus tradisional pada makanan seperti lemper dan lontong. Fungsi utama dari kemasan makanan adalah...', 'pilihan_ganda', 'A', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Melindungi produk makanan dan menarik minat beli konsumen'),
    (v_q_id, 'B', 'Membuat makanan menjadi lebih berat saat ditimbang'),
    (v_q_id, 'C', 'Mengubah rasa makanan menjadi lebih asin'),
    (v_q_id, 'D', 'Memperlambat proses pengolahan bahan makanan'),
    (v_q_id, 'E', 'Menghilangkan kandungan nutrisi alami makanan');

    -- SOAL 5
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Salah satu teknik memasak makanan tradisional dengan cara mematangkan bahan makanan menggunakan uap air mendidih disebut teknik...', 'pilihan_ganda', 'A', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Mengukus (steaming)'),
    (v_q_id, 'B', 'Menggoreng (frying)'),
    (v_q_id, 'C', 'Memanggang (baking)'),
    (v_q_id, 'D', 'Menumis (sauteing)'),
    (v_q_id, 'E', 'Menyangrai (roasting)');

    -- SOAL 6
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Bahan pangan nabati yang sering dijadikan bahan utama dalam pembuatan makanan tradisional seperti getuk dan kolak adalah...', 'pilihan_ganda', 'C', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Daging sapi'),
    (v_q_id, 'B', 'Telur bebek'),
    (v_q_id, 'C', 'Singkong dan ubi'),
    (v_q_id, 'D', 'Ikan tongkol'),
    (v_q_id, 'E', 'Susu kambing');

    -- SOAL 7
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Dalam perencanaan biaya usaha makanan, biaya yang dikeluarkan untuk membeli bahan baku utama pembuatan makanan tergolong ke dalam...', 'pilihan_ganda', 'A', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Biaya variabel (variable cost)'),
    (v_q_id, 'B', 'Biaya tetap (fixed cost)'),
    (v_q_id, 'C', 'Pajak penghasilan'),
    (v_q_id, 'D', 'Laba kotor'),
    (v_q_id, 'E', 'Bunga pinjaman bank');

    -- SOAL 8
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Kegiatan memperkenalkan dan menyebarluaskan informasi tentang produk makanan olahan khas daerah kepada calon konsumen disebut...', 'pilihan_ganda', 'B', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Evaluasi produksi'),
    (v_q_id, 'B', 'Promosi dan pemasaran'),
    (v_q_id, 'C', 'Pembukuan keuangan'),
    (v_q_id, 'D', 'Penyusutan aset modal'),
    (v_q_id, 'E', 'Uji kelayakan mesin pabrik');

    -- SOAL 9
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Media promosi modern yang paling efektif, cepat, dan terjangkau untuk mempromosikan produk makanan khas daerah di era digital saat ini adalah...', 'pilihan_ganda', 'B', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Selebaran brosur cetak hitam putih'),
    (v_q_id, 'B', 'Media sosial (seperti Instagram, TikTok, WhatsApp)'),
    (v_q_id, 'C', 'Surat pos berperangko'),
    (v_q_id, 'D', 'Papan pengumuman kantor desa'),
    (v_q_id, 'E', 'Pemasangan baliho raksasa di jalan tol');

    -- SOAL 10
    INSERT INTO public.questions (teacher_id, question_text, question_type, correct_answer, category_id)
    VALUES (v_teacher_id, 'Salah satu manfaat penting dari berwirausaha membuat dan menjual makanan khas tradisional bagi generasi muda adalah...', 'pilihan_ganda', 'B', v_category_id)
    RETURNING id INTO v_q_id;

    INSERT INTO public.question_options (question_id, option_label, option_text) VALUES
    (v_q_id, 'A', 'Mengurangi minat masyarakat terhadap makanan sehat'),
    (v_q_id, 'B', 'Melestarikan warisan kuliner nusantara sekaligus menciptakan peluang kerja'),
    (v_q_id, 'C', 'Menghapuskan keberadaan seluruh makanan modern di pasaran'),
    (v_q_id, 'D', 'Menaikkan harga makanan pokok setinggi-tingginya'),
    (v_q_id, 'E', 'Menghindari pemanfaatan bahan pangan hasil panen lokal');

    RAISE NOTICE '10 Soal PKWU berhasil dimasukkan ke Bank Soal!';
END $$;
