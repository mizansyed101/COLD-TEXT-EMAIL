import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

export function parseFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.csv') {
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });
    return normalizeData(result.data);
  } else if (ext === '.xlsx' || ext === '.xls') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    return normalizeData(data);
  } else {
    throw new Error('Unsupported file format. Please use .csv or .xlsx');
  }
}

function normalizeData(data) {
  return data.map(row => {
    const normalizedRow = {};
    for (const key in row) {
      const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
      normalizedRow[normalizedKey] = row[key];
    }
    return normalizedRow;
  });
}

export function filterDuplicates(data) {
  const seen = new Set();
  return data.filter(row => {
    const identifier = `${row.email || ''}|${row.business_name || ''}`.toLowerCase();
    if (seen.has(identifier)) {
      return false;
    }
    seen.add(identifier);
    return true;
  });
}
