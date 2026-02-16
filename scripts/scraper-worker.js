// scripts/scraper-worker.js
import { scrapeGoogleJobs } from '../lib/v2/google-jobs-scraper.js';
import { writeToCache } from '../lib/v2/job-cache.js';

/**
 * CLI Worker to populate the local cache
 * Usage: node scripts/scraper-worker.js "Software Engineer" "Bangalore"
 */
async function run() {
    const query = process.argv[2];
    const location = process.argv[3] || '';

    if (!query) {
        console.error('Usage: node scripts/scraper-worker.js <query> [location]');
        process.exit(1);
    }

    console.log(`[WORKER] Starting scrape for "${query}" in "${location}"...`);

    try {
        const results = await scrapeGoogleJobs(query, location, 12);
        console.log(`[WORKER] Successfully scraped ${results.length} jobs`);

        writeToCache(query, location, results);
        console.log('[WORKER] Cache populated. API route is now ready.');

    } catch (err) {
        console.error('[WORKER] Scrape failed:', err.message);
        process.exit(1);
    }
}

run();
