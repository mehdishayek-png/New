// scripts/test-scraper.js
import { scrapeGoogleJobs } from '../lib/v2/google-jobs-scraper.js';
import { normalizeScraperResults } from '../lib/v2/serp-normalizer.js';
import { deduplicateJobs } from '../lib/v2/job-dedup.js';

async function test() {
    const query = "Customer Experience Operations Lead";
    const location = "Bangalore, India";

    console.log('--- TEST 1: Scraper Execution ---');
    try {
        const rawResults = await scrapeGoogleJobs(query, location, 3);
        console.log(`✅ Scraped ${rawResults.length} raw results`);

        console.log('\n--- TEST 2: Normalization ---');
        const normalized = normalizeScraperResults(rawResults);
        console.log(`✅ Normalized ${normalized.length} results`);
        if (normalized.length > 0) {
            console.log('Sample Schema:', JSON.stringify(normalized[0], null, 2));
        }

        console.log('\n--- TEST 3: Deduplication ---');
        // Add a fake duplicate
        if (normalized.length > 0) {
            const withDup = [...normalized, normalized[0]];
            console.log(`Input count: ${withDup.length}`);
            const deduped = deduplicateJobs(withDup);
            console.log(`Output count: ${deduped.length}`);
            if (deduped.length === normalized.length) {
                console.log('✅ Deduplication working as expected');
            } else {
                console.error('❌ Deduplication failed');
            }
        }

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

test();
