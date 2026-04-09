import { Controller, Get, Query } from '@nestjs/common';
import { WikipediaService } from './wikipedia.service';

@Controller('wiki')
export class WikipediaController {
  constructor(private readonly wikipedia: WikipediaService) {}

  @Get('search')
  async search(@Query('q') q: string): Promise<{ slug: string; title: string }[]> {
    if (!q || q.trim().length < 2) return [];
    return this.wikipedia.searchArticles(q.trim());
  }
}
