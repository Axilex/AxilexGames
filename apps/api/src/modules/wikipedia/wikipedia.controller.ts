import { Controller, Get, HttpException, HttpStatus, Ip, Query } from '@nestjs/common';
import { WikipediaService } from './wikipedia.service';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQ = 30;
const MAX_QUERY_LENGTH = 100;

interface RateBucket {
  count: number;
  resetAt: number;
}

@Controller('wiki')
export class WikipediaController {
  /**
   * In-memory per-IP rate limiter. Keeps the project's "no external state" rule
   * (cf. CLAUDE.md). Single-instance only — fine for the current deployment.
   */
  private readonly buckets = new Map<string, RateBucket>();

  constructor(private readonly wikipedia: WikipediaService) {}

  @Get('search')
  async search(
    @Query('q') q: string,
    @Ip() ip: string,
  ): Promise<{ slug: string; title: string }[]> {
    this.enforceRateLimit(ip || 'unknown');
    if (!q) return [];
    const trimmed = q.trim();
    if (trimmed.length < 2) return [];
    if (trimmed.length > MAX_QUERY_LENGTH) {
      throw new HttpException('QUERY_TOO_LONG', HttpStatus.BAD_REQUEST);
    }
    return this.wikipedia.searchArticles(trimmed);
  }

  private enforceRateLimit(key: string): void {
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return;
    }
    if (bucket.count >= RATE_LIMIT_MAX_REQ) {
      throw new HttpException('TOO_MANY_REQUESTS', HttpStatus.TOO_MANY_REQUESTS);
    }
    bucket.count += 1;
  }
}
