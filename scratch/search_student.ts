import pkg from 'xlsx';
const { readFile, utils } = pkg;
import * as fs from 'fs';

function searchExcel(term: string) {
  console.log(`\nSearching for: "${term}"`);
  const files = ['KELAS X.xlsx', 'KELAS XI.xlsx'];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const workbook = readFile(file);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      for (let r = 0; r < rawData.length; r++) {
        const row = rawData[r];
        if (!row) continue;
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c]);
          if (val.toLowerCase().includes(term.toLowerCase())) {
            console.log(`Match in ${file} -> Sheet "${sheetName}" -> Row ${r}:`, row.slice(0, 8));
          }
        }
      }
    }
  }
}

searchExcel('Sangjalu');
searchExcel('Kayyisa');
searchExcel('Arriza');
searchExcel('Alika');
