const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const GhostWatch = require('./ghostwatch');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --- UAPF Initialization ---
const dictionaryPath = path.resolve(__dirname, '../dictionaries/ghostwatch.dict.v1');
if (!fs.existsSync(dictionaryPath)) {
    console.error("FATAL: Dictionary not found. Run 'npm run train-dict' first.");
    process.exit(1);
}

const optimizer = new GhostWatch({
    dictPath: dictionaryPath,
    wss: wss // Pass the WebSocket server instance
});

// --- UAPF Middleware Integration ---
app.use(optimizer.expressMiddleware()); // HTTP Compression & Deduplication

// --- Monitoring Endpoint ---
app.get('/metrics', optimizer.metricsExporter()); // Prometheus Scrape

// --- Dictionary Endpoint for Clients (Hot-Swap) ---
app.get('/ghostwatch/dictionary', optimizer.dictionaryMiddleware());

// --- Demo Route ---
app.get('/api/data', (req, res) => {
    // This payload will be compressed by the expressMiddleware
    const largePayload = JSON.stringify({
        timestamp: Date.now(),
        data: "X".repeat(1024 * 50), // 50KB of compressible data
        schema: 'telemetry_v1'
    });
    res.send(largePayload);
});

// --- WebSocket Setup (Real-Time Optimization) ---
wss.on('connection', (ws) => {
    console.log('Client connected. Starting WebSocket optimization.');
    
    // Attach the optimizer to the new connection
    optimizer.optimizeWebSocket(ws, 'main_room');

    // Simulate sending real-time data every 500ms
    const interval = setInterval(() => {
        const message = {
            metric: 'cpu_usage',
            value: Math.random() * 100,
            time: Date.now()
        };
        // The optimizer handles batching and compression automatically
        optimizer.sendWebSocketMessage('main_room', message); 
    }, 500);

    ws.on('close', () => {
        clearInterval(interval);
        console.log('Client disconnected.');
        optimizer.cleanupWebSocket('main_room');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Prometheus metrics available at http://localhost:${PORT}/metrics`);
});