const xlsx = require('xlsx');
const path = 'C:\\Laboratorios\\app-gastos\\requerimientos\\INFORMES_TRANSACCIONES_dd24b129-2b58-46d5-9c38-27068c495cfa.xlsx';
try {
  const workbook = xlsx.readFile(path);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
  console.log("HEADERS:", data[0]);
  console.log("ROW 1:", data[1]);
  console.log("ROW 2:", data[2]);
} catch (e) {
  console.error("Error:", e.message);
}
