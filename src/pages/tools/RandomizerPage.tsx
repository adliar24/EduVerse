import React from 'react';
import Randomizer from '../../components/tools/Randomizer';

export default function RandomizerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Pemilihan Acak</h1>
        <p className="text-slate-500 mt-1">
          Undian acak nama siswa menggunakan Roda Putar, Kotak Keberuntungan, atau Kocok Dadu.
        </p>
      </div>
      <Randomizer />
    </div>
  );
}
