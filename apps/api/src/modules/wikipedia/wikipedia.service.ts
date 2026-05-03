import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { WikipediaPage } from '@wiki-race/shared';
import { sanitizeWikipediaHtml, extractSlugsFromHtml } from './sanitizer';
import articlePool from './article-pool.json';

const API_BASE = 'https://fr.wikipedia.org/api/rest_v1/page/html';
const SEARCH_API = 'https://fr.wikipedia.org/w/api.php';
const USER_AGENT = 'WikiRace/1.0 (educational multiplayer game; contact via GitHub)';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_MAX_SIZE = 500;
const MAX_RETRIES = 3;
const NOT_FOUND_TTL_MS = 60 * 1000; // 1 minute — short enough that fixing a typo upstream recovers fast
const NOT_FOUND_MAX_SIZE = 200;

interface CacheEntry {
  page: WikipediaPage;
  links: Set<string>;
  fetchedAt: number;
}

@Injectable()
export class WikipediaService {
  private readonly logger = new Logger(WikipediaService.name);
  private readonly cache = new Map<string, CacheEntry>();
  /** Negative cache: slugs that returned 404, with their first-seen timestamp. */
  private readonly notFound = new Map<string, number>();

  selectStartAndTarget(): { start: string; target: string } {
    const pool = [...articlePool];
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return { start: pool[0], target: pool[1] };
  }

  async searchArticles(query: string): Promise<{ slug: string; title: string }[]> {
    const params = new URLSearchParams({
      action: 'opensearch',
      search: query,
      limit: '6',
      namespace: '0',
      format: 'json',
      origin: '*',
    });
    const response = await axios.get<[string, string[], string[], string[]]>(
      `${SEARCH_API}?${params}`,
      { headers: { 'User-Agent': USER_AGENT }, timeout: 5_000 },
    );
    const [, titles, , urls] = response.data;
    return titles.map((title, i) => ({
      title,
      slug: (urls[i] ?? '').split('/wiki/')[1] ?? title.replace(/ /g, '_'),
    }));
  }

  async fetchPage(slug: string): Promise<WikipediaPage> {
    const normalized = this.normalizeSlug(slug);
    const cached = this.touch(normalized);
    if (cached) return cached.page;

    if (this.isKnownNotFound(normalized)) {
      throw new Error(`ARTICLE_NOT_FOUND: ${normalized}`);
    }

    let rawHtml: string;
    try {
      rawHtml = await this.fetchWithRetry(normalized);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('ARTICLE_NOT_FOUND')) {
        this.rememberNotFound(normalized);
      }
      throw err;
    }
    const htmlContent = sanitizeWikipediaHtml(rawHtml);
    const links = extractSlugsFromHtml(htmlContent);

    const page: WikipediaPage = {
      slug: normalized,
      title: this.slugToTitle(normalized),
      htmlContent,
    };

    this.setCache(normalized, { page, links, fetchedAt: Date.now() });
    return page;
  }

  async extractLinks(htmlContent: string): Promise<Set<string>> {
    return extractSlugsFromHtml(htmlContent);
  }

  async isValidNavigation(fromSlug: string, toSlug: string): Promise<boolean> {
    const from = this.normalizeSlug(fromSlug);
    const to = this.normalizeSlug(toSlug);
    const cached = this.touch(from);
    if (cached) return cached.links.has(to);
    // Not cached — fetch and check
    await this.fetchPage(from);
    const entry = this.cache.get(from);
    return entry ? entry.links.has(to) : false;
  }

  /**
   * Returns the cache entry for `slug` if fresh, refreshing its LRU position.
   * Returns null if missing or expired (caller should re-fetch).
   */
  private touch(slug: string): CacheEntry | null {
    const entry = this.cache.get(slug);
    if (!entry || Date.now() - entry.fetchedAt >= CACHE_TTL_MS) return null;
    this.cache.delete(slug);
    this.cache.set(slug, entry);
    return entry;
  }

  private isKnownNotFound(slug: string): boolean {
    const at = this.notFound.get(slug);
    if (at === undefined) return false;
    if (Date.now() - at >= NOT_FOUND_TTL_MS) {
      this.notFound.delete(slug);
      return false;
    }
    return true;
  }

  private rememberNotFound(slug: string): void {
    if (this.notFound.size >= NOT_FOUND_MAX_SIZE) {
      const oldest = this.notFound.keys().next().value;
      if (oldest) this.notFound.delete(oldest);
    }
    this.notFound.set(slug, Date.now());
  }

  private normalizeSlug(slug: string): string {
    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  }

  private async fetchWithRetry(slug: string): Promise<string> {
    const url = `${API_BASE}/${encodeURIComponent(slug)}`;
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await axios.get<string>(url, {
          headers: {
            Accept: 'text/html; charset=utf-8',
            'User-Agent': USER_AGENT,
          },
          responseType: 'text',
          timeout: 10_000,
        });
        return response.data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Rate limited fetching ${slug}, retrying in ${delay}ms`);
          await this.sleep(delay);
          lastError = new Error(`Rate limited: ${slug}`);
        } else if (axios.isAxiosError(err) && err.response?.status === 404) {
          throw new Error(`ARTICLE_NOT_FOUND: ${slug}`);
        } else {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < MAX_RETRIES - 1) {
            await this.sleep(500 * (attempt + 1));
          }
        }
      }
    }
    throw lastError;
  }

  private setCache(slug: string, entry: CacheEntry): void {
    if (this.cache.size >= CACHE_MAX_SIZE) {
      // Evict the least-recently-used entry (first key in Map insertion order)
      const oldest = this.cache.keys().next().value;
      if (oldest) this.cache.delete(oldest);
    }
    this.cache.set(slug, entry);
  }

  private slugToTitle(slug: string): string {
    return slug.replace(/_/g, ' ');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
