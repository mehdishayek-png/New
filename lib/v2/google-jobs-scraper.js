// lib/v2/google-jobs-scraper.js
import { chromium } from 'playwright';

/**
 * List of modern User Agents to rotate for anti-blocking
 */
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

/**
 * Random delay to mimic human behavior
 */
const randomDelay = (min = 1000, max = 3000) =>
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

/**
 * Core Scraper function for Google Jobs
 */
export async function scrapeGoogleJobs(query, location = '', maxResults = 12) {
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ userAgent });
    const page = await context.newPage();

    const results = [];

    try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&ibp=htl;jobs`;
        if (location) {
            // Note: Google Jobs usually handles location better via the search query itself or dedicated params
            // but the IBP interface often uses a specific location filter UI.
            // We'll append location to query for the most reliable results across regions.
        }

        console.log(`[SCRAPER] Navigating to: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle' });
        await randomDelay(2000, 4000);

        // Initial check for blocker (CAPTCHA or "Our systems have detected...")
        const content = await page.content();
        if (content.includes('Our systems have detected unusual traffic') || content.includes('captcha')) {
            throw new Error('BLOCKED: Google detected automated traffic');
        }

        // Selector for job card containers (dynamic names used by Google)
        // Common pattern is 'li' items within an 'ol' or 'div' with specific roles
        const jobCardsSelector = '[role="listitem"]';

        // Wait for at least one card
        await page.waitForSelector(jobCardsSelector, { timeout: 10000 }).catch(() => {
            console.warn('[SCRAPER] No job cards found after timeout');
        });

        let cards = await page.$$(jobCardsSelector);
        console.log(`[SCRAPER] Found ${cards.length} initial job cards`);

        // Process cards up to maxResults
        for (let i = 0; i < Math.min(cards.length, maxResults); i++) {
            try {
                const card = cards[i];

                // Click card to open detail panel
                await card.click();
                await randomDelay(1000, 2000);

                // Extract basic info from the card or the active detail panel
                // Detail panel usually has ID or specific class structure
                const jobData = await page.evaluate(() => {
                    // Inner helpers to find elements by common data attributes or roles
                    const getVal = (selector) => document.querySelector(selector)?.innerText?.trim() || '';

                    // These selectors are common but Google obfuscates them often
                    // We target typical roles and relative positions
                    const title = document.querySelector('h2[role="heading"]')?.innerText || '';
                    const company = document.querySelector('.vNEEBe')?.innerText || ''; // Common company class
                    const location = document.querySelector('.Q861Of')?.innerText || ''; // Common location class
                    const via = document.querySelector('.K6066d')?.innerText || ''; // "via indeed"

                    // Full description panel
                    const description = document.querySelector('.HBvzbc')?.innerText || '';

                    // Apply links
                    const applyLinks = Array.from(document.querySelectorAll('a[role="button"]'))
                        .filter(a => a.innerText.toLowerCase().includes('apply'))
                        .map(a => a.href);

                    return {
                        title,
                        company_name: company,
                        location,
                        description,
                        via,
                        apply_options: applyLinks.map(link => ({ link })),
                        job_id: window.location.hash.match(/htidocid=([^&]+)/)?.[1] || Math.random().toString(36).substring(7)
                    };
                });

                if (jobData.title) {
                    results.push(jobData);
                    console.log(`[SCRAPER] Extracted: ${jobData.title} @ ${jobData.company_name}`);
                }
            } catch (err) {
                console.error(`[SCRAPER] Failed to extract card ${i}:`, err.message);
            }
        }

    } catch (err) {
        console.error(`[SCRAPER] Critical error:`, err.message);
        throw err;
    } finally {
        await browser.close();
    }

    return results;
}
