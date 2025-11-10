UAPF-GhostWatch/
├── dictionaries/               # Zstd dictionary files (versioned)
│   ├── ghostwatch.dict.v1
│   └── ghostwatch.dict.v2
├── server/
│   ├── ghostwatch.js           # Core UAPF Class (Server Logic)
│   ├── server.js               # Express/WebSocket/Prometheus Setup
│   └── package.json            # Dependencies: express, ws, prom-client, zstd-codec
├── client/
│   ├── ghostwatch-client.js    # Core UAPF Client Library
│   ├── index.html              # Demo HTML
│   └── package.json            # Dependencies: zstd-codec (for browser)
├── test/
│   ├── chaos.test.js           # Chaos Test Suite
│   └── performance.test.js     # Compression benchmarking
├── .gitignore
├── README.md                   # Documentation, ROI, and Integration
└── prometheus.yml              # Prometheus config for scraping