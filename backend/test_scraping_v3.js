const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env.local'), override: true });

async function testScrapingV3() {
    // Check both potential variables
    const url = process.env.N8N_SCRAPING_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL;
    
    if (!url) {
        console.error('❌ Error: No webhook URL found (N8N_SCRAPING_WEBHOOK_URL or N8N_WEBHOOK_URL).');
        return;
    }

    console.log('Testing Scraping connection to:', url);
    
    // Payload used by ScrapingController.triggerScraping
    const payload = {
        city: 'Casablanca',
        keyword: 'coworking',
        limit: 10
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));

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
        console.log('\n--- TEXT RESPONSE ---');
        console.log(text);

        try {
            const json = JSON.parse(text);
            console.log('\n--- JSON RESPONSE ---');
            console.log(JSON.stringify(json, null, 2));
            
            if (response.status === 500) {
                console.error('\n❌ n8n returned Internal Server Error. Check n8n logs/executions.');
            }
        } catch (e) {
            console.log('\n⚠️ Response is not JSON.');
        }

    } catch (error) {
        console.error('❌ Fetch error:', error.message);
    }
}

testScrapingV3();
