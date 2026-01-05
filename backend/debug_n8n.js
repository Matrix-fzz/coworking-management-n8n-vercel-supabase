const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config();

async function debugN8n() {
    const url = process.env.N8N_AGENT_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    
    console.log('--- N8N DIAGNOSTICS ---');
    console.log('Configured URL:', url || 'NOT SET');
    
    if (!url) {
        console.error('Error: No webhook URL found in .env or .env.local');
        return;
    }

    console.log('Sending test payload to n8n...');
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatInput: 'test connection', userMessage: 'test connection', history: [] })
        });

        console.log('Response Status:', response.status);
        console.log('Response Status Text:', response.statusText);
        
        const text = await response.text();
        console.log('Response Body:', text);

        if (response.status === 404) {
            console.error('\n!!! 404 DETECTED !!!');
            console.error('This means n8n received the request but says this URL does not exist.');
            console.error('Check if the workflow is ACTIVE and using the correct PRODUCTION URL.');
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

debugN8n();
