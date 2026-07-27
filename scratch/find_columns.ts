import pkg from 'xlsx';
const { readFile, utils } = pkg;
import * as fs from 'fs';

function findCols(filepath: string) {
  console.log(`\n============================\nFile: ${filepath}`);
  const workbook = readFile(filepath);
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rawData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    console.log(`\nSheet: ${sheetName}`);
    // Show first 15 rows
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      // Filter out empty arrays or arrays with only empty elements
      const row = rawData[i];
      if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        console.log(`Row ${i}:`, row.slice(0, 10)); // print first 10 columns of the row
      }
    }
  }
}

findCols('KELAS X.xlsx');
findCols('KELAS XI.xlsx');
