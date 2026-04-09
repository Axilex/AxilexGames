import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { WikipediaService } from './wikipedia.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// isAxiosError is a type predicate — needs explicit cast for mocking
const mockIsAxiosError = (value: boolean) => {
  jest
    .spyOn(axios, 'isAxiosError')
    .mockImplementation((_err: unknown): _err is AxiosError => value);
};

const SAMPLE_HTML = `
  <p>La <a href="./France">France</a> est un pays.</p>
  <p>Sa capitale est <a href="./Paris">Paris</a>.</p>
  <p><a href="./Tour_Eiffel">Tour Eiffel</a></p>
`;

async function setup() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [WikipediaService],
  }).compile();
  return module.get<WikipediaService>(WikipediaService);
}

describe('WikipediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAxiosError(false);
  });

  describe('fetchPage', () => {
    it('fetches and sanitizes a page', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({ data: SAMPLE_HTML });
      const service = await setup();

      const page = await service.fetchPage('France');
      expect(page.slug).toBe('France');
      expect(page.htmlContent).toContain('href="/wiki/Paris"');
      expect(page.htmlContent).not.toContain('./');
    });

    it('returns cached result on second call (no second HTTP request)', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({ data: SAMPLE_HTML });
      const service = await setup();

      await service.fetchPage('France');
      await service.fetchPage('France');

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('throws ARTICLE_NOT_FOUND on 404', async () => {
      mockedAxios.get = jest.fn().mockRejectedValue({ response: { status: 404 } });
      mockIsAxiosError(true);
      const service = await setup();

      await expect(service.fetchPage('ArticleInexistant')).rejects.toThrow('ARTICLE_NOT_FOUND');
    });

    it('retries on 429 rate limit', async () => {
      const rateLimitError = { response: { status: 429 } };
      mockedAxios.get = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: SAMPLE_HTML });
      mockIsAxiosError(true);

      const service = await setup();
      // Spy on private sleep to avoid real waits
      jest.spyOn(service as unknown as { sleep: () => Promise<void> }, 'sleep').mockResolvedValue();

      const page = await service.fetchPage('France');
      expect(page.slug).toBe('France');
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('isValidNavigation', () => {
    it('returns true when target link exists on the page', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({ data: SAMPLE_HTML });
      const service = await setup();

      const valid = await service.isValidNavigation('France', 'Paris');
      expect(valid).toBe(true);
    });

    it('returns false when target link does not exist on the page', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({ data: SAMPLE_HTML });
      const service = await setup();

      const valid = await service.isValidNavigation('France', 'Allemagne');
      expect(valid).toBe(false);
    });

    it('uses the cache instead of re-fetching', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({ data: SAMPLE_HTML });
      const service = await setup();

      await service.fetchPage('France'); // prime cache
      await service.isValidNavigation('France', 'Paris');

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('selectStartAndTarget', () => {
    it('returns two different slugs', () => {
      const service = new WikipediaService();
      const { start, target } = service.selectStartAndTarget();
      expect(start).not.toBe(target);
      expect(typeof start).toBe('string');
      expect(typeof target).toBe('string');
    });

    it('returns values from the article pool', async () => {
      const articlePool = (await import('./article-pool.json')).default;
      const service = new WikipediaService();
      for (let i = 0; i < 10; i++) {
        const { start, target } = service.selectStartAndTarget();
        expect(articlePool).toContain(start);
        expect(articlePool).toContain(target);
      }
    });
  });

  describe('LRU cache eviction', () => {
    it('evicts oldest entry when cache exceeds max size', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({ data: SAMPLE_HTML });
      const service = await setup();

      // Access private cache
      const cache = (service as unknown as { cache: Map<string, unknown> }).cache;
      const MAX = 500;

      // Fill cache to max
      for (let i = 0; i < MAX; i++) {
        cache.set(`Article_${i}`, { page: {}, links: new Set(), fetchedAt: Date.now() });
      }
      expect(cache.size).toBe(MAX);

      // Fetch a new article — should evict Article_0
      await service.fetchPage('France');
      expect(cache.size).toBe(MAX);
      expect(cache.has('Article_0')).toBe(false);
      expect(cache.has('France')).toBe(true);
    });
  });
});
