import OpenAI from 'openai';

async function makeRequest(useStreaming: boolean = false) {
    try {
        // Initialize OpenAI client with custom baseURL
        const openai = new OpenAI({
            baseURL: 'http://localhost:3000',
            apiKey: 'dummy-key' // Required by the client but not used with local server
        });

        if (useStreaming) {
            // Make a completion request with streaming enabled
            const stream = await openai.chat.completions.create({
                messages: [{ role: "user", content: "Tell me a long story about a cat!" }],
                model: "gpt-3.5-turbo",
                stream: true,
            });

            // Process the stream
            console.log("Streaming response:");
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                process.stdout.write(content); // Force flush
            }
            console.log('\n'); // Add a newline at the end
        } else {
            // Make a regular completion request
            const completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: "Tell me a long story about a cat!" }],
                model: "gpt-3.5-turbo",
            });
            console.log("completion text:", completion.choices[0].message.content);
        }

    } catch (error) {
        console.error('Error making request:', error);
    }
}

// Run the request without streaming
makeRequest(false).then(() => {
    console.log("\n");
});

makeRequest(true).then(() => {
    console.log("\n");
    console.log("done");
});

makeRequest(true).then(() => {
    console.log("\n");
    console.log("done");
});

makeRequest(true).then(() => {
    console.log("\n");
    console.log("done");
});


makeRequest(true).then(() => {
    console.log("\n");
    console.log("done");
});

// Uncomment to run with streaming