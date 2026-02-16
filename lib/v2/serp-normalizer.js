// lib/v2/serp-normalizer.js

/**
 * Normalizes internal scraper output to match SerpAPI schema
 */
export function normalizeScraperResults(results) {
    return results.map(job => ({
        title: job.title,
        company_name: job.company_name,
        location: job.location,
        description: job.description,
        via: job.via || 'Google Jobs',
        job_id: job.job_id,
        // Add compatibility fields that matcher expects
        detected_extensions: {
            posted_at: 'Recently' // Internal scraper doesn't focus on extension extraction yet
        }
    }));
}
