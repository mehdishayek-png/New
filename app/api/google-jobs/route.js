// app/api/google-jobs/route.js
import { NextResponse } from 'next/server';
import { readFromCache } from '../../../lib/v2/job-cache';
import { normalizeScraperResults } from '../../../lib/v2/serp-normalizer';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location');

    if (!query) {
        return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
    }

    console.log(`[API_V2] GET /api/google-jobs q="${query}" loc="${location || ''}"`);

    // Architecture Decision: API route ONLY serves from cache to prevent Playwright/Vercel timeouts
    // The cache is populated by a local script running in the background.
    const cachedResults = readFromCache(query, location);

    if (!cachedResults) {
        return NextResponse.json({
            jobs_results: [],
            _error: 'No cached results found for this query. Ensure local scraper has run.',
            _metadata: { source: 'internal_scraper', status: 'cache_miss' }
        });
    }

    const normalized = normalizeScraperResults(cachedResults);

    return NextResponse.json({
        jobs_results: normalized,
        _metadata: {
            source: 'internal_scraper',
            status: 'cache_hit',
            result_count: normalized.length
        }
    });
}
