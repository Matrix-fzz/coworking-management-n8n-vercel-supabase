const dotenv = require('dotenv');
dotenv.config();

async function testN8n() {
    const url = process.env.N8N_SCRAPING_WEBHOOK_URL  || 'https://n8n.zackdev.io/webhook-test/search-places';
    
    console.log('Testing n8n connection to:', url);
    
    const payload = {
        keyword: 'dentist',
        city: 'Casablanca'
    };

    console.log('Payload:', payload);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        const text = await response.text();
        console.log('Raw response body:', text.substring(0, 500) + '...');

        try {
            const json = JSON.parse(text);
            console.log('JSON parsed successfully');
            if (Array.isArray(json)) {
                console.log(`Received array with ${json.length} items`);
                if (json.length > 0) console.log('First item:', json[0]);
            } else {
                console.log('Received object:', json);
            }
        } catch (e) {
            console.log('Could not parse JSON');
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testN8n();
