require('dotenv').config();
const { google } = require('googleapis');

const links = [
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS212",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS333",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS23424",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS1235135",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS12345272",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS132584246",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS15672461",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS15725725783",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS14263158ww5",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS13241fDF",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS108275JBFJBA",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS133258965976789235",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS1FBAIBIFIQV",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS1OJFHOUGOUGQOIEGF",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS1KJNFGINUBIBA",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS1DHJOUHQOUGF",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS1DSACASCASFASF",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS1LLSAKDLKDAS",
  "https://checkout.teachable.com/secure/2174069/checkout/order_shwsj7t2?coupon_code=THEREEFERGUYS1DAFASF"
];

async function populateSheet() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // First, set up headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:B1',
      valueInputOption: 'RAW',
      resource: {
        values: [['Link', 'Status']]
      }
    });

    // Then add all links
    const values = links.map(link => [link, '']); // Empty status means unused
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A2:B20', // Adjust range based on number of links
      valueInputOption: 'RAW',
      resource: {
        values
      }
    });

    console.log('Sheet populated successfully with', links.length, 'links');
  } catch (error) {
    console.error('Error populating sheet:', error);
  }
}

populateSheet();
