import pkg from 'xlsx';
const { readFile, utils } = pkg;

const workbook = readFile('KELAS X.xlsx');
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const rawData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  let nonCount = 0;
  for (let r = 0; r < rawData.length; r++) {
    const row = rawData[r];
    if (row && row.length > 3) {
      const jk = String(row[3] || '').trim();
      if (jk !== '' && jk !== '0' && jk !== 'JK' && jk !== 'L/P' && jk !== 'KETERANGAN') {
        nonCount++;
        if (nonCount <= 5) {
          console.log(`Sheet "${sheetName}" row ${r}:`, row.slice(0, 5));
        }
      }
    }
  }
  console.log(`Sheet "${sheetName}": Total rows with non-empty column 3 = ${nonCount}`);
}
