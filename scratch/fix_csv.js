import fs from 'fs';
const data = `business_name,contact_name,email,phone,channel
Acme Corp,Rahul Sharma,r@acme.com,+919876543210,both
Beta Studio,Priya Das,p@beta.com,,email
Gamma Ventures,, ,+918888888888,whatsapp
Duplicate Co,John Doe,j@dup.com,+1234567890,email
Duplicate Co,John Doe,j@dup.com,+1234567890,email`;

fs.writeFileSync('contacts.csv', data, 'utf8');
console.log('contacts.csv written');
