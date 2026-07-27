import pkg from 'xlsx';
const { readFile, utils } = pkg;
import * as fs from 'fs';

function checkFile(filepath: string) {
  console.log(`\nChecking: ${filepath}`);
  if (!fs.existsSync(filepath)) {
    console.log("File does not exist!");
    return;
  }
  const workbook = readFile(filepath);
  console.log("Sheets:", workbook.SheetNames);
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    if (rawData.length > 0) {
      console.log(`Sheet "${sheetName}": First row/headers:`, rawData[0]);
      console.log(`Total rows: ${rawData.length}`);
      if (rawData.length > 1) {
        console.log(`Sample row 1:`, rawData[1]);
      }
    }
  }
}

checkFile('KELAS X.xlsx');
checkFile('KELAS XI.xlsx');
