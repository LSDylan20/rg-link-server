const axios = require('axios');

const testWebhook = async () => {
  try {
    // Simulate Stripe checkout.session.completed webhook
    const payload = {
      id: 'evt_test123',
      type: 'checkout.session.completed',
      api_version: '2024-12-18.acacia',
      data: {
        object: {
          id: 'cs_test_123',
          customer_details: {
            email: 'Dylanpeterson@gmail.com',
            name: 'Test Customer'
          }
        }
      },
      livemode: true
    };

    console.log('Sending test webhook...');

    // First check server status
    const statusRes = await axios.get('http://localhost:3333/status');
    console.log('Server Status:', statusRes.data);

    // Send test webhook
    const response = await axios.post('http://localhost:3333/webhook/stripe', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=123,v1=test'
      }
    });

    console.log('Webhook Response:', response.data);

    // Check status again to verify link was marked as used
    const newStatus = await axios.get('http://localhost:3333/status');
    console.log('Updated Status:', newStatus.data);

  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Run test
console.log('Starting webhook test...');
testWebhook();
