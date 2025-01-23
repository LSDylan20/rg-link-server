require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
app.use(express.json());

// Constants
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'Sheet1';
const RANGE = 'A:B';

// Health check endpoint for deployment
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Google Sheets setup
let sheetsClient = null;

async function initGoogleSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log('Google Sheets client initialized');
    
    // Create sheet if it doesn't exist
    try {
      await sheetsClient.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1:B1'
      });
    } catch (error) {
      // If sheet doesn't exist, create it with headers
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1:B1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Link', 'Status']]
        }
      });
      console.log('Created sheet with headers');
    }
  } catch (error) {
    console.error('Error initializing Google Sheets:', error);
  }
}

// Initialize on startup
initGoogleSheets();

// Get available links from Google Sheet
async function getAvailableLink() {
  try {
    if (!sheetsClient) {
      throw new Error('Google Sheets client not initialized');
    }

    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${RANGE}`,
    });

    const rows = response.data.values || [];
    console.log('Found rows:', rows.length);
    
    // Skip header row, find first unused link
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i][1] || rows[i][1] !== 'used') {
        console.log('Found available link at row:', i + 1);
        return { link: rows[i][0], rowIndex: i + 1 };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting links:', error);
    throw error;
  }
}

// Mark link as used in Google Sheet
async function markLinkAsUsed(rowIndex) {
  try {
    if (!sheetsClient) {
      throw new Error('Google Sheets client not initialized');
    }

    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!B${rowIndex}`,
      valueInputOption: 'RAW',
      resource: {
        values: [['used']]
      }
    });
    console.log('Marked link as used at row:', rowIndex);
  } catch (error) {
    console.error('Error marking link as used:', error);
    throw error;
  }
}

// Send email using SendGrid
async function sendEmail(email, name, link) {
  try {
    const msg = {
      to: email,
      from: {
        email: 'info@thereeferguys.com',
        name: 'The Reefer Guys'
      },
      templateId: 'd-e370650d38914ee498610b05eedc3a27',
      dynamicTemplateData: {
        name: name,
        link: link
      }
    };
    
    console.log('Sending email with data:', {
      to: email,
      name: name,
      link: link
    });
    
    await sgMail.send(msg);
    console.log('Email sent successfully to:', email);
  } catch (error) {
    // Log detailed error information
    console.error('SendGrid Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.body,
      errors: error.response?.body?.errors,
      statusCode: error.code || error.response?.statusCode,
      headers: error.response?.headers,
      email: email,
      template: 'd-e370650d38914ee498610b05eedc3a27',
      data: {
        name: name,
        link: link
      }
    });

    // Check if it's an authentication error
    if (error.code === 401) {
      console.error('SendGrid Authentication Error - Please verify API key');
    }
    // Check if it's a sender verification error
    else if (error.response?.body?.errors?.some(e => e.message?.includes('sender'))) {
      console.error('SendGrid Sender Verification Error - Please verify sender email');
    }
    throw error;
  }
}

// Stripe webhook endpoint
app.post('/webhook/stripe', async (req, res) => {
  try {
    const event = req.body;
    console.log('Received webhook:', event.type);

    // Handle only completed checkout sessions
    if (event.type !== 'checkout.session.completed') {
      return res.json({ received: true });
    }

    // Get customer data
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name || 'Customer';

    if (!customerEmail) {
      throw new Error('No customer email provided');
    }

    console.log('Processing for customer:', customerEmail);

    // Get next available link
    const linkData = await getAvailableLink();
    if (!linkData) {
      console.error('No available links');
      return res.status(500).json({ error: 'No available links' });
    }

    // Send email
    await sendEmail(customerEmail, customerName, linkData.link);
    console.log('Email sent to:', customerEmail);

    // Mark link as used
    await markLinkAsUsed(linkData.rowIndex);
    console.log('Link marked as used:', linkData.link);

    res.json({
      success: true,
      message: 'Link sent successfully',
      usedLink: linkData.link,
      customer: {
        email: customerEmail,
        name: customerName
      }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Status endpoint
app.get('/status', async (req, res) => {
  try {
    if (!sheetsClient) {
      throw new Error('Google Sheets client not initialized');
    }

    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${RANGE}`,
    });

    const rows = response.data.values || [];
    const total = rows.length - 1; // Exclude header
    const used = rows.filter(row => row[1] === 'used').length;

    res.json({
      totalLinks: total,
      usedLinks: used,
      remainingLinks: total - used
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3333;

// Only start server if port is available
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port or stop the other process.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
