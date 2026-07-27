import pkg from 'xlsx';
const { readFile, utils } = pkg;

const workbook = readFile('KELAS X.xlsx');
const sheet = workbook.Sheets['A'];
const rawData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
for (let i = 0; i < Math.min(20, rawData.length); i++) {
  console.log(`Row ${i}:`, rawData[i]);
}
