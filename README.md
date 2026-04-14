# Cold Outreach Agent

A local Node.js CLI agent for personalized outreach via Email (Nodemailer) and WhatsApp (via scanning your personal account's QR code).

## Features
- **WhatsApp (Free)**: Uses `whatsapp-web.js` to send messages via your personal account (No Twilio/Meta API needed).
- **Email Support**: SMTP via Nodemailer.
- **Template System**: Merge row data into templates with `{tokens}`.
- **Auto-Duplicate Detection**: Skips rows with the same email/business combination.
- **Dry Run**: Preview all messages in terminal without sending.

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Create a `.env` file (based on `.env.example`).
   - Fill in your Email SMTP credentials.

3. **Prepare Templates**:
   - Edit `templates/cold_email.txt` and `templates/whatsapp_msg.txt`.

## Usage

### First Run (WhatsApp Authentication)
The first time you run the agent with a WhatsApp channel, it will display a **QR Code** in the terminal.
1. Open WhatsApp on your phone.
2. Go to **Settings > Linked Devices > Link a Device**.
3. Scan the QR code in your terminal.
4. Once "Ready!", the agent will start the outreach.

```bash
# Basic dry run (highly recommended)
node agent.js --file contacts.csv --dry-run
```

### Outreach Commands
```bash
# Real run (will prompt for QR if not linked)
node agent.js --file contacts.csv

# Limit to first 5 rows
node agent.js --file contacts.csv --limit 5

# Send only via email
node agent.js --file contacts.csv --channel email
```

## Safety Note
> [!CAUTION]
> Sending automated messages from a personal WhatsApp account carries a high risk of being banned if you send bulk spam. Keep `DELAY_MS` in your `.env` at a safe level (e.g., `5000` or higher) and only message people you have a reason to contact.
