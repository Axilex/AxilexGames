import { Injectable } from '@nestjs/common';
import { Player, GameSession, Room, PlayerStatus, GameMode } from '@wiki-race/shared';
import { BingoConstraintId } from '@wiki-race/shared';

export type PageCategory =
  | 'PERSON'
  | 'COUNTRY'
  | 'CITY'
  | 'SPORTSPERSON'
  | 'ARTIST'
  | 'FILM_SERIES'
  | 'SCIENCE'
  | 'UNKNOWN';

function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).replace(/_/g, ' ');
  } catch {
    return slug;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class ModeService {
  // ─── Bingo ───────────────────────────────────────────────────────────────

  checkConstraints(ids: BingoConstraintId[], slug: string, html: string): BingoConstraintId[] {
    const category = this.detectPageCategory(html);
    return ids.filter((id) => this.checkOne(id, slug, html, category));
  }

  /**
   * Classifies a Wikipedia page by reading infobox `<th>` row headers.
   * Checks from most specific to least specific so that, e.g., a footballer
   * whose infobox also has "Naissance" is returned as SPORTSPERSON, not PERSON.
   */
  detectPageCategory(html: string): PageCategory {
    // French commune infoboxes use class="commune", not class="infobox"
    if (/<table[^>]*class="[^"]*\bcommune\b[^"]*"/i.test(html)) return 'CITY';

    if (!this.hasInfobox(html)) {
      return this.isSciencePage(html) ? 'SCIENCE' : 'UNKNOWN';
    }

    // Most specific sub-types of PERSON first
    if (/<th[^>]*>\s*Sport\s*<\/th>/i.test(html)) return 'SPORTSPERSON';
    if (this.isArtistInfobox(html)) return 'ARTIST';
    if (/<th[^>]*>\s*Naissance\s*<\/th>/i.test(html)) return 'PERSON';

    if (/<th[^>]*>\s*(Capitale|Gentilé)\s*<\/th>/i.test(html)) return 'COUNTRY';
    if (/<th[^>]*>\s*Code postal\s*<\/th>/i.test(html)) return 'CITY';
    if (/<th[^>]*>\s*(Réalisation|Réalisateur|Chaîne|Créateur)\s*<\/th>/i.test(html))
      return 'FILM_SERIES';
    if (this.isSciencePage(html)) return 'SCIENCE';

    return 'UNKNOWN';
  }

  private checkOne(
    id: BingoConstraintId,
    slug: string,
    html: string,
    category: PageCategory,
  ): boolean {
    switch (id) {
      case 'year_in_title':
        return this.checkYearInTitle(slug);
      case 'biographical':
        return category === 'PERSON' || category === 'ARTIST' || category === 'SPORTSPERSON';
      case 'country':
        return category === 'COUNTRY';
      case 'has_main_image':
        return this.checkHasMainImage(html);
      case 'artist':
        return category === 'ARTIST';
      case 'sportsperson':
        return category === 'SPORTSPERSON';
      case 'city':
        return category === 'CITY';
      case 'many_images':
        return this.checkManyImages(html);
      case 'film_or_series':
        return category === 'FILM_SERIES';
      case 'science':
        return category === 'SCIENCE';
    }
  }

  /**
   * Returns true if the HTML contains an element with class="...infobox...".
   * French Wikipedia infoboxes always carry this class.
   */
  private hasInfobox(html: string): boolean {
    return /<table[^>]*class="[^"]*\binfobox\b[^"]*"/i.test(html);
  }

  /**
   * Returns the HTML substring starting at the infobox opening tag (up to 6000 chars).
   * Covers the infobox content even when it contains nested tables.
   */
  private infoboxArea(html: string): string {
    const idx = html.search(/<table[^>]*class="[^"]*\binfobox\b[^"]*"/i);
    if (idx === -1) return '';
    return html.slice(idx, idx + 6000);
  }

  /**
   * True when the infobox has an "Activité" or "Profession" row AND the
   * infobox area contains an artist-related keyword.
   */
  private isArtistInfobox(html: string): boolean {
    if (!/<th[^>]*>\s*(Activité|Profession)\s*<\/th>/i.test(html)) return false;
    return /\b(chanteur|chanteuse|musicien|musicienne|acteur|actrice|peintre|compositeur|compositrice|artiste)\b/i.test(
      stripHtml(this.infoboxArea(html)),
    );
  }

  /**
   * True when the first paragraph mentions a scientific discipline.
   * Scoping to the lede avoids flagging biographies of scientists.
   */
  private isSciencePage(html: string): boolean {
    const firstP = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[0] ?? '';
    return /\b(mathématiques|physique|chimie|biologie|astronomie|géologie|mécanique|thermodynamique)\b/i.test(
      stripHtml(firstP),
    );
  }

  private checkYearInTitle(slug: string): boolean {
    return /\b\d{4}\b/.test(normalizeSlug(slug));
  }

  /** Main image: a Wikimedia thumbnail must appear inside the infobox area. */
  private checkHasMainImage(html: string): boolean {
    return /<img[^>]+src="[^"]*\/thumb\/[^"]*"/i.test(this.infoboxArea(html));
  }

  /** 5+ Wikimedia thumbnail images (excludes small icons and flags). */
  private checkManyImages(html: string): boolean {
    return (html.match(/<img[^>]+src="[^"]*\/thumb\/[^"]*"/gi) ?? []).length >= 5;
  }

  checkBingoWin(player: Player, game: GameSession): boolean {
    if (game.mode !== GameMode.BINGO || !game.bingoConstraintIds) return false;
    return player.bingoValidated.length >= game.bingoConstraintIds.length;
  }

  allPlayersFinished(room: Room): boolean {
    return Array.from(room.players.values()).every((p) => p.status !== PlayerStatus.CONNECTED);
  }
}
