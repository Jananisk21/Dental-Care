const fetch = require('node-fetch'); // we'll use native fetch since node 18+

async function test() {
    try {
        const response = await fetch('http://localhost:3000/api/book-appointment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // invalid token to see if we get JSON
                'Authorization': `Bearer fake_token`
            },
            body: JSON.stringify({
                userId: "test-uid",
                userName: "Test User",
                userEmail: "test@example.com",
                bookingType: "In-person",
                consultationMode: "NA",
                date: "2026-03-20",
                time: "09:30",
                paymentStatus: "not_required"
            })
        });
        
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);
        console.log("JSON parsing:", JSON.parse(text));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

test();
