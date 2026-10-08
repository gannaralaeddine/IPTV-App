const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 8080;
const URL = process.env.MONGODB_URI || process.env.URL || "mongodb://localhost:27017/iptv";

// Resolve data directory: check DATA_DIR env, or fallback to 'My DATA' or 'data' in project root
const defaultDataDir = fs.existsSync(path.resolve(__dirname, '../../My DATA'))
    ? path.resolve(__dirname, '../../My DATA')
    : path.resolve(__dirname, '../../data');

const DATA_DIR = process.env.DATA_DIR || defaultDataDir;

const LIVE_DIR = path.join(DATA_DIR, 'LIVE');
const VOD_DIR = path.join(DATA_DIR, 'VOD');
const SERIES_DIR = path.join(DATA_DIR, 'SERIES');

// Ensure upload/stream directories exist
try {
    fs.mkdirSync(LIVE_DIR, { recursive: true });
    fs.mkdirSync(VOD_DIR, { recursive: true });
    fs.mkdirSync(SERIES_DIR, { recursive: true });
} catch (e) {
    console.error('Error creating media directories:', e.message);
}

module.exports = {
    PORT,
    URL,
    DATA_DIR,
    LIVE_DIR,
    VOD_DIR,
    SERIES_DIR
};

