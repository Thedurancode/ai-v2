// Simple script to test Perplexity API
import axios from 'axios';

// Read API key from environment or use the provided key
const API_KEY = process.env.PERPLEXITY_API_KEY || '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';

async function testPerplexityAPI() {
  console.log('Testing Perplexity API with key:', API_KEY.substring(0, 10) + '...');

  try {
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant."
          },
          {
            role: "user",
            content: "What are the top tech companies in 2023?"
          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    console.log('API call successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('API call failed!');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }

    return false;
  }
}

// Run the test
testPerplexityAPI().then(success => {
  console.log('Test completed with', success ? 'SUCCESS' : 'FAILURE');
  process.exit(success ? 0 : 1);
});