# Reefer Guys Link Server

A Node.js server that manages Teachable course links and sends emails via SendGrid.

## Deployment to Render

### 1. Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Choose the repository and branch

### 2. Configure the Service

Use these settings:
- **Name**: `rg-link-server` (or your preferred name)
- **Environment**: `Docker`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your deployment branch)
- **Instance Type**: Starter (or higher based on needs)

### 3. Set Environment Variables

Add these environment variables in Render dashboard:

```
SENDGRID_API_KEY=your_sendgrid_api_key
GOOGLE_CREDENTIALS=your_google_service_account_json
SPREADSHEET_ID=your_google_sheet_id
PORT=3333
```

Notes:
- For GOOGLE_CREDENTIALS, paste the entire service account JSON as a single line
- Make sure info@thereeferguys.com is verified in SendGrid
- The Google Sheet should have columns: Link, Status

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy your service
3. Once deployed, you'll get a .onrender.com URL

### 5. Update Stripe Webhook

Update your Stripe webhook endpoint to point to:
```
https://your-app-name.onrender.com/webhook/stripe
```

## Local Development

1. Clone the repository
2. Create .env file with required variables (see above)
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Testing

Use test-webhook.js to simulate a Stripe webhook:
```bash
node test-webhook.js
```

## Environment Variables

- `SENDGRID_API_KEY`: Your SendGrid API key
- `GOOGLE_CREDENTIALS`: Google service account JSON (as a single line)
- `SPREADSHEET_ID`: ID of your Google Sheet
- `PORT`: Server port (defaults to 3333)

## Features

- Manages Teachable course links in Google Sheets
- Sends welcome emails via SendGrid
- Processes Stripe webhook events
- Tracks link usage status
