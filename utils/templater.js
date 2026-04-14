import 'dotenv/config';

export function fillTemplate(templateText, rowData) {
  let filledText = templateText;
  
  const tokens = {
    business_name: rowData.business_name || 'your business',
    contact_name: rowData.contact_name || 'there',
    sender_name: process.env.SENDER_NAME || 'Your Name',
    sender_role: process.env.SENDER_ROLE || 'Founder'
  };

  Object.keys(tokens).forEach(token => {
    const regex = new RegExp(`{${token}}`, 'g');
    filledText = filledText.replace(regex, tokens[token]);
  });

  const unreplaced = filledText.match(/{[a-zA-Z0-9_]+}/g);
  
  return {
    text: filledText,
    unreplaced: unreplaced || []
  };
}
