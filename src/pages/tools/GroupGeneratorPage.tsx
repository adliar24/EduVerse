import React from 'react';
import GroupGenerator from '../../components/tools/GroupGenerator';

export default function GroupGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Pembagi Kelompok</h1>
        <p className="text-slate-500 mt-1">
          Bagi siswa kelasmu ke dalam kelompok secara acak, seimbang gender, atau heterogen.
        </p>
      </div>
      <GroupGenerator themeColor="blue" />
    </div>
  );
}
