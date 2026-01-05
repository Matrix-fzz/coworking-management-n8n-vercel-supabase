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

    console.log(`Sending test payload to: ${url}`);
    
    try {
        const payload = { 
            chatInput: 'Hello, how can you help me today?', 
            userMessage: 'Hello, how can you help me today?', 
            history: [] 
        };
        console.log('Payload:', JSON.stringify(payload));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('--- RESPONSE ---');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
        
        const text = await response.text();
        console.log('Raw Body Length:', text.length);
        console.log('Raw Body Content:', text || '(EMPTY BODY)');

        if (text) {
            try {
                const json = JSON.parse(text);
                console.log('Parsed JSON:', JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('Body is not valid JSON.');
            }
        }

        if (response.status === 404) {
            console.error('\n!!! 404 NOT FOUND !!!');
            console.error('The webhook URL is likely incorrect or the workflow is not active.');
        } else if (text.trim() === "" && response.ok) {
            console.error('\n!!! EMPTY RESPONSE DETECTED !!!');
            console.error('The workflow returned 200 OK but no body.');
            console.error('Check your "Respond to Webhook" node in n8n.');
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

debugN8n();
