import fs from 'fs';
import path from 'path';

function fixFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
}

// Fix templates
fixFile('templates/cold_email.txt', `Subject: Quick question for {business_name}

Hi {contact_name},

I came across {business_name} and wanted to reach out regarding your current outreach strategy.

Best,
{sender_name}, {sender_role}`);

fixFile('templates/whatsapp_msg.txt', `Hi {contact_name}! I'm {sender_name} from XYZ. I'd love to discuss something quick with the team at {business_name}. Can we connect?`);

// Fix contacts (again, just in case)
fixFile('contacts.csv', `business_name,contact_name,email,phone,channel
Acme Corp,Rahul Sharma,r@acme.com,+919876543210,both
Beta Studio,Priya Das,p@beta.com,,email
Gamma Ventures,, ,+918888888888,whatsapp
Duplicate Co,John Doe,j@dup.com,+1234567890,email
Duplicate Co,John Doe,j@dup.com,+1234567890,email`);

// Create a .env if it doesn't exist (since .env.example was created)
if (!fs.existsSync('.env')) {
    fixFile('.env', `SENDER_NAME=Your Name
SENDER_ROLE=Founder
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=you@gmail.com
FROM_NAME=Your Name
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
DELAY_MS=2000
MAX_CONCURRENT=1`);
}
