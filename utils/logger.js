import fs from 'fs';
import Papa from 'papaparse';

const LOG_FILE = 'output_log.csv';

export function logResult(result) {
  const row = {
    business_name: result.business_name || '',
    contact_name: result.contact_name || '',
    channel: result.channel || '',
    status: result.status || '',
    timestamp: new Date().toISOString(),
    error: result.error || '',
  };

  const csv = Papa.unparse([row], { header: !fs.existsSync(LOG_FILE) });
  
  if (fs.existsSync(LOG_FILE)) {
    fs.appendFileSync(LOG_FILE, '\n' + csv);
  } else {
    fs.writeFileSync(LOG_FILE, csv);
  }
}
