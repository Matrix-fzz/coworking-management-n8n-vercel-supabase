// Comprehensive diagnostic test for n8n-v3
async function diagnosticV3() {
    const url = 'https://n8n.zackdev.io/webhook/ai-agent-v3';
    console.log(`🚀 Testing Final Webhook V3: ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Hello from diagnostic script', history: [] })
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        const body = await response.text();
        
        try {
            const json = JSON.parse(body);
            console.log('✅ Response Body:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('❌ Raw Response (Not JSON):', body);
        }
        
        if (response.status === 200) {
            console.log('\n✨ WEBHOOK WORKING PERFECTLY!');
        } else {
            console.error('\n⚠️ FEW THINGS TO CHECK:');
            console.error('1. Is the workflow ACTIVE in n8n?');
            console.error('2. Are your AI credentials (OpenRouter) valid and have balance?');
            console.error('3. Check n8n "Executions" tab for the specific error details.');
        }
    } catch (err) {
        console.error('💥 FETCH ERROR:', err.message);
    }
}

diagnosticV3();
