// lib/v2/job-dedup.js
import crypto from 'crypto';

/**
 * Creates a unique hash for a job to identify duplicates
 */
export function getJobHash(job) {
    const normalizedTitle = (job.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedCompany = (job.company_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedLocation = (job.location || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    return crypto.createHash('md5')
        .update(`${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`)
        .digest('hex');
}

/**
 * Deduplicates jobs across multiple sources or within a large scrape
 */
export function deduplicateJobs(jobs) {
    const seen = new Set();
    const uniqueJobs = [];

    for (const job of jobs) {
        const hash = getJobHash(job);
        if (!seen.has(hash)) {
            seen.add(hash);
            uniqueJobs.push(job);
        }
    }

    return uniqueJobs;
}
