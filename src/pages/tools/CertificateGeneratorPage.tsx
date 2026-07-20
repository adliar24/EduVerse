import React from 'react';
import CertificateGenerator from '../../components/tools/CertificateGenerator';

export default function CertificateGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Sertifikat Penghargaan</h1>
        <p className="text-slate-500 mt-1">
          Buat kartu ucapan penghargaan prestasi siswa secara manual maupun massal via berkas Excel.
        </p>
      </div>
      <CertificateGenerator />
    </div>
  );
}
