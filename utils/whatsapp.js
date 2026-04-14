import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';

let client;
let isReady = false;

/**
 * Initialize the WhatsApp client
 */
export async function initializeWhatsApp() {
  console.log(chalk.cyan('🔄 Initializing WhatsApp client...'));
  
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  return new Promise((resolve, reject) => {
    client.on('qr', (qr) => {
      console.log(chalk.yellow('\n📲 Please scan the QR code below with your phone:'));
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
      console.log(chalk.green('✅ WhatsApp client is ready!'));
      isReady = true;
      resolve(true);
    });

    client.on('auth_failure', (msg) => {
      console.error(chalk.red('❌ WhatsApp authentication failed:'), msg);
      reject(new Error(msg));
    });

    client.initialize().catch(err => {
      console.error(chalk.red('❌ Failed to initialize WhatsApp:'), err.message);
      reject(err);
    });
  });
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsApp({ to, body }) {
  if (!isReady) {
    return { success: false, error: 'WhatsApp client not initialized or ready' };
  }

  // Normalize phone number (remove +, spaces, etc.)
  let chatId = to.replace(/[^0-9]/g, '');

  // Handle common Indian formats
  if (chatId.length === 10) {
    // 10-digit mobile number, assume India (+91)
    chatId = '91' + chatId;
  } else if (chatId.length === 11 && chatId.startsWith('0')) {
    // 11-digit number starting with 0, replace 0 with India (+91)
    chatId = '91' + chatId.substring(1);
  }

  if (!chatId.includes('@c.us')) {
    chatId += '@c.us';
  }

  try {
    const response = await client.sendMessage(chatId, body);
    return { success: true, id: response.id._serialized };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
