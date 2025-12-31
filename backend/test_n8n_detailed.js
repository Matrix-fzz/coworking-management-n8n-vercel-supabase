// Test n8n webhook directly
const testN8n = async () => {
    const url = 'https://n8n.zackdev.io/webhook/ai-agent';
    
    console.log('Testing n8n webhook...');
    console.log('URL:', url);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello, test message',
                history: [],
                userId: null,
                timestamp: new Date().toISOString()
            })
        });
        
        console.log('\n--- RESPONSE ---');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
            console.log('\n--- JSON RESPONSE ---');
            console.log(JSON.stringify(responseData, null, 2));
        } else {
            responseData = await response.text();
            console.log('\n--- TEXT RESPONSE ---');
            console.log(responseData);
        }
        
        if (response.ok) {
            console.log('\n✅ SUCCESS: n8n is working correctly!');
        } else {
            console.error('\n❌ ERROR: n8n returned an error');
        }
        
    } catch (error) {
        console.error('\n❌ FETCH ERROR:', error.message);
        console.error('Full error:', error);
    }
};

testN8n();
