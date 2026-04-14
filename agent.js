import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';
import chalk from 'chalk';
import pLimit from 'p-limit';

import { parseFile, filterDuplicates } from './utils/parser.js';
import { fillTemplate } from './utils/templater.js';
import { sendEmail } from './utils/mailer.js';
import { sendWhatsApp } from './utils/whatsapp.js';
import { logResult } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments
const args = minimist(process.argv.slice(2), {
  string: ['file', 'channel', 'template', 'limit'],
  boolean: ['dry-run'],
  alias: { f: 'file', d: 'dry-run', c: 'channel', t: 'template', l: 'limit' }
});

const DEFAULT_DELAY = parseInt(process.env.DELAY_MS || '2000');
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '1');
const limit = pLimit(MAX_CONCURRENT);

const { initializeWhatsApp } = await import('./utils/whatsapp.js');

async function run() {
  const filePath = args.file;
  if (!filePath) {
    console.error(chalk.red('Error: Please provide an input file using --file <path>'));
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(chalk.red(`Error: File not found: ${filePath}`));
    process.exit(1);
  }

  console.log(chalk.cyan(`\n🚀 Starting Cold Outreach Agent`));
  console.log(chalk.gray(`----------------------------------`));

  try {
    // 1. Initialise WhatsApp if needed
    const needsWhatsApp = args.channel === 'whatsapp' || args.channel === 'both' || (!args.channel && true); // true as default might use whatsapp
    
    // For simplicity, we'll initialize it if not a dry-run or if explicitly requested
    if (!args['dry-run']) {
        await initializeWhatsApp();
    }

    // 2. Parse Data
    let data = parseFile(filePath);
    console.log(chalk.blue(`ℹ️ Loaded ${data.length} rows from ${path.basename(filePath)}`));

    // 2. Filter Duplicates
    const originalCount = data.length;
    data = filterDuplicates(data);
    const duplicateCount = originalCount - data.length;
    if (duplicateCount > 0) {
      console.log(chalk.yellow(`⚠️ Skipped ${duplicateCount} duplicate rows`));
    }

    // 3. Apply Limit
    if (args.limit) {
      data = data.slice(0, parseInt(args.limit));
      console.log(chalk.blue(`ℹ️ Limiting to first ${data.length} rows`));
    }

    // 4. Load Templates
    const emailTemplatePath = path.join(__dirname, 'templates', 'cold_email.txt');
    const whatsappTemplatePath = path.join(__dirname, 'templates', 'whatsapp_msg.txt');
    
    let emailTemplate = '';
    let whatsappTemplate = '';

    if (fs.existsSync(emailTemplatePath)) emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');
    if (fs.existsSync(whatsappTemplatePath)) whatsappTemplate = fs.readFileSync(whatsappTemplatePath, 'utf8');

    // 5. Process Rows
    const summary = { sent: 0, failed: 0, skipped: 0, duplicate: duplicateCount };

    const tasks = data.map((row, index) => limit(async () => {
      const businessName = row.business_name || 'Unknown';
      let channel = (args.channel || row.channel || 'email').toLowerCase();
      
      // Intelligent Fallback Logic
      if (channel === 'email' && !row.email && row.phone) {
        console.log(chalk.yellow(`  ℹ️ Email missing, falling back to WhatsApp for ${businessName}`));
        channel = 'whatsapp';
      } else if (channel === 'whatsapp' && !row.phone && row.email) {
        console.log(chalk.yellow(`  ℹ️ Phone missing, falling back to Email for ${businessName}`));
        channel = 'email';
      }
      
      console.log(chalk.white(`\n[${index + 1}/${data.length}] Processing: ${chalk.bold(businessName)}`));

      const channelsToProcess = channel === 'both' ? ['email', 'whatsapp'] : [channel];

      for (const ch of channelsToProcess) {
        // Validation (only skip if the specific channel being tried is missing data)
        if (ch === 'email' && !row.email) {
          logAndSkip(row, ch, 'missing email', summary);
          continue;
        }
        if (ch === 'whatsapp' && !row.phone) {
          logAndSkip(row, ch, 'missing phone', summary);
          continue;
        }

        // Templating
        const template = ch === 'email' ? emailTemplate : whatsappTemplate;
        let { text, unreplaced } = fillTemplate(template, row);
        let subject = `Quick question for ${businessName}`;

        if (ch === 'email' && text.startsWith('Subject:')) {
          const lines = text.split('\n');
          subject = lines[0].replace(/^Subject:\s*/i, '').trim();
          text = lines.slice(1).join('\n').trim();
        }

        if (unreplaced.length > 0) {
          console.warn(chalk.yellow(`  ⚠️ Warning: Unreplaced tokens in ${ch}: ${unreplaced.join(', ')}`));
        }

        if (args['dry-run']) {
          console.log(chalk.magenta(`  [DRY RUN] Channel: ${ch}`));
          console.log(chalk.gray(`  Subject: ${subject}`));
          console.log(chalk.gray(`  Message:\n  ${text.replace(/\n/g, '\n  ')}`));
          summary.sent++;
          logResult({ ...row, channel: ch, status: 'dry-run' });
        } else {
          // Actual Send
          let sendResult;
          if (ch === 'email') {
            sendResult = await sendEmail({
              to: row.email,
              subject: subject,
              text: text,
              fromEmail: process.env.FROM_EMAIL
            });
          } else {
            sendResult = await sendWhatsApp({
              to: row.phone,
              body: text
            });
          }

          if (sendResult.success) {
            console.log(chalk.green(`  ✅ Sent via ${ch}`));
            summary.sent++;
            logResult({ ...row, channel: ch, status: 'sent' });
          } else {
            console.error(chalk.red(`  ❌ Failed via ${ch}: ${sendResult.error}`));
            summary.failed++;
            logResult({ ...row, channel: ch, status: 'failed', error: sendResult.error });
          }
        }

        // Delay between sends
        if (!args['dry-run'] && index < data.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY));
        }
      }
    }));

    await Promise.all(tasks);

    // 6. Final Summary
    console.log(chalk.cyan(`\n----------------------------------`));
    console.log(chalk.bold(`Outreach Summary:`));
    console.log(chalk.green(`  Sent:     ${summary.sent}`));
    console.log(chalk.red(`  Failed:   ${summary.failed}`));
    console.log(chalk.yellow(`  Skipped:  ${summary.skipped}`));
    if (summary.duplicate > 0) console.log(chalk.gray(`  Duplicates: ${summary.duplicate}`));
    console.log(chalk.cyan(`----------------------------------\n`));
    console.log(chalk.gray(`Full logs written to output_log.csv\n`));

  } catch (error) {
    console.error(chalk.red(`\n💥 Fatal Error: ${error.message}`));
    process.exit(1);
  }
}

function logAndSkip(row, channel, reason, summary) {
  console.log(chalk.yellow(`  ⚠️ Skipped ${channel}: ${reason}`));
  summary.skipped++;
  logResult({ ...row, channel, status: 'skipped', error: reason });
}

run();
