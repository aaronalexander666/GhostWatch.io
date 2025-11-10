// This file should be included in the browser or compiled with a bundler

class GhostWatchClient {
    constructor(wsUrl, appOnMessage) {
        this.wsUrl = wsUrl;
        this.appOnMessage = appOnMessage;
        this.ws = null;
        this.dictVersion = 0;
        this.dctx = null; // Zstd Decompression Context
        this.init();
    }

    async init() {
        await this.fetchDictionary();
        this.connect();
    }

    async fetchDictionary() {
        console.log(`[UAPF] Fetching dictionary (current v${this.dictVersion})...`);
        const res = await fetch('/ghostwatch/dictionary');
        if (!res.ok) throw new Error('Failed to fetch Zstd dictionary.');
        
        const buf = await res.arrayBuffer();
        const ver = +res.headers.get('X-Dict-Version');
        
        // Atomic hot-swap
        const ZSTDDecompress = (await ZstdCodec.run()).ZSTDDecompress;
        this.dctx = new ZSTDDecompress(buf);
        this.dictVersion = ver;
        console.log(`[UAPF] Dictionary hot-swapped to v${ver}.`);
    }

    connect() {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = () => console.log('WebSocket connected.');
        this.ws.onclose = () => console.log('WebSocket closed.');
        this.ws.onerror = (err) => console.error('WebSocket error:', err);
        
        // The critical interception layer
        this.ws.onmessage = this.onMessage.bind(this);
    }

    async onMessage(event) {
        // 1. Control frame (Hot-Swap signal)
        if (typeof event.data === 'string') {
            try {
                const msg = JSON.parse(event.data);
                if (msg.op === 'dict_update' && msg.ver > this.dictVersion) {
                    await this.fetchDictionary(); // Trigger hot-swap
                    return; // Drop control frame
                }
            } catch (_) { /* Ignore non-JSON or non-control strings */ }
            
            // Pass the regular string message to the app
            this.appOnMessage({ data: event.data, target: this.ws });
            return;
        }

        // 2. Binary compressed frame
        if (event.data instanceof ArrayBuffer) {
            try {
                // Decompression with the current dictionary context
                const decompressedBuffer = this.dctx.decompress(new Uint8Array(event.data));
                const jsonString = new TextDecoder().decode(decompressedBuffer);
                
                // Pass the decompressed JSON string to the application
                this.appOnMessage({ data: jsonString, target: this.ws });
            } catch (e) {
                console.warn('[UAPF] Decompression failed (Poison Frame dropped).', e);
                // CRITICAL: DO NOT forward the raw binary event.data
            }
        }
    }
}