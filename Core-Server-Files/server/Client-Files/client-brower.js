// Example Client Connection (after including ghostwatch-client.js)

const APP_WS_URL = 'ws://localhost:3000';

// 1. Define your original message handler
function applicationMessageHandler(event) {
    // This function receives the fully decompressed JSON string/text
    const data = JSON.parse(event.data);
    console.log('App received fully decompressed message:', data);
    // ... continue with application logic
}

// 2. Initialize the UAPF Client Wrapper
const uapfClient = new GhostWatchClient(
    APP_WS_URL, 
    applicationMessageHandler
);

// uapfClient handles connection, dictionary fetch, decompression, and hot-swaps transparently.