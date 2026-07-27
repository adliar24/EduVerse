import pkg from 'xlsx';
const { readFile, utils } = pkg;

const workbook = readFile('KELAS X.xlsx');
const sheet = workbook.Sheets['PRESENSI FOTO 2025'];
const rawData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
for (let i = 0; i < Math.min(30, rawData.length); i++) {
  const row = rawData[i];
  if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
    console.log(`Row ${i}:`, row.slice(0, 10));
  }
}
