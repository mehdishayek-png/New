// lib/v2/job-cache.js
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'scrape-cache');
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
}

/**
 * Get hash for query + location
 */
function getQueryHash(query, location) {
    return crypto.createHash('md5')
        .update(`${query.toLowerCase()}|${(location || '').toLowerCase()}`)
        .digest('hex');
}

/**
 * Write results to local JSON cache
 */
export function writeToCache(query, location, results) {
    ensureCacheDir();
    const hash = getQueryHash(query, location);
    const filePath = path.join(CACHE_DIR, `${hash}.json`);

    const cacheData = {
        timestamp: Date.now(),
        query,
        location,
        results
    };

    fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2));
    console.log(`[CACHE] Wrote ${results.length} results to ${filePath}`);
}

/**
 * Read results from local JSON cache
 */
export function readFromCache(query, location) {
    const hash = getQueryHash(query, location);
    const filePath = path.join(CACHE_DIR, `${hash}.json`);

    if (!fs.existsSync(filePath)) return null;

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        const age = Date.now() - data.timestamp;
        if (age > CACHE_TTL) {
            console.log(`[CACHE] Expired entry for ${query}`);
            return null;
        }

        console.log(`[CACHE] Hit for ${query} (${data.results.length} jobs)`);
        return data.results;
    } catch (err) {
        console.error('[CACHE] Error reading cache:', err.message);
        return null;
    }
}
