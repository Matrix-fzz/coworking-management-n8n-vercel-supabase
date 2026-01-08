// Simple test to see full n8n response
fetch('https://n8n.zackdev.io/webhook/ai-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: 'Hello test',
        history: []
    })
})
.then(async res => {
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
    
    if (res.status !== 200) {
        console.error('\n❌ ERROR - n8n returned:', res.status);
    } else {
        console.log('\n✅ SUCCESS');
    }
})
.catch(err => {
    console.error('Fetch error:', err.message);
});
