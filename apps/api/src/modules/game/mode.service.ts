import { Injectable } from '@nestjs/common';
import {
  Player,
  GameSession,
  Room,
  PlayerStatus,
  DriftObjective,
  GameMode,
} from '@wiki-race/shared';
import { BingoConstraintId } from '@wiki-race/shared';

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
  // ─── Drift ───────────────────────────────────────────────────────────────

  computeDriftScore(objective: DriftObjective, html: string, slug: string): number {
    switch (objective) {
      case DriftObjective.OLDEST_TITLE_YEAR: {
        const title = normalizeSlug(slug);
        const matches = title.match(/\b\d{4}\b/g);
        if (!matches) return 9999;
        return Math.min(...matches.map(Number));
      }
      case DriftObjective.SHORTEST: {
        const text = stripHtml(html);
        if (!text) return 0;
        return text.split(' ').length;
      }
      case DriftObjective.MOST_IMAGES: {
        return (html.match(/<img/g) ?? []).length;
      }
    }
  }

  isBetterDriftScore(
    objective: DriftObjective,
    candidate: number,
    current: number | null,
  ): boolean {
    if (current === null) return true;
    switch (objective) {
      case DriftObjective.OLDEST_TITLE_YEAR:
        return candidate < current;
      case DriftObjective.SHORTEST:
        return candidate < current;
      case DriftObjective.MOST_IMAGES:
        return candidate > current;
    }
  }

  updatePlayerDriftScore(
    player: Player,
    score: number,
    slug: string,
    objective: DriftObjective,
  ): void {
    if (this.isBetterDriftScore(objective, score, player.driftBestScore)) {
      player.driftBestScore = score;
      player.driftBestSlug = slug;
    }
  }

  rankDriftPlayers(players: Player[], objective: DriftObjective): Player[] {
    return [...players].sort((a, b) => {
      // null scores go last
      if (a.driftBestScore === null && b.driftBestScore === null) return 0;
      if (a.driftBestScore === null) return 1;
      if (b.driftBestScore === null) return -1;

      switch (objective) {
        case DriftObjective.OLDEST_TITLE_YEAR:
        case DriftObjective.SHORTEST:
          // lower is better
          if (a.driftBestScore !== b.driftBestScore) return a.driftBestScore - b.driftBestScore;
          break;
        case DriftObjective.MOST_IMAGES:
          // higher is better
          if (a.driftBestScore !== b.driftBestScore) return b.driftBestScore - a.driftBestScore;
          break;
      }
      // tie-break: fewer hops = explored more directly
      return a.history.length - b.history.length;
    });
  }

  // ─── Bingo ───────────────────────────────────────────────────────────────

  checkConstraints(ids: BingoConstraintId[], slug: string, html: string): BingoConstraintId[] {
    return ids.filter((id) => this.checkOne(id, slug, html));
  }

  private checkOne(id: BingoConstraintId, slug: string, html: string): boolean {
    switch (id) {
      case 'year_in_title':
        return this.checkYearInTitle(slug);
      case 'biographical':
        return this.checkBiographical(html);
      case 'country':
        return this.checkCountry(html);
      case 'has_main_image':
        return this.checkHasMainImage(html);
      case 'artist':
        return this.checkArtist(html);
      case 'sportsperson':
        return this.checkSportsperson(html);
      case 'city':
        return this.checkCity(html);
      case 'many_images':
        return this.checkManyImages(html);
      case 'film_or_series':
        return this.checkFilmOrSeries(html);
      case 'science':
        return this.checkScience(html);
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

  private checkYearInTitle(slug: string): boolean {
    return /\b\d{4}\b/.test(normalizeSlug(slug));
  }

  /** Biographical page: infobox must have a "Naissance" row header. */
  private checkBiographical(html: string): boolean {
    return this.hasInfobox(html) && /<th[^>]*>\s*Naissance\s*<\/th>/i.test(html);
  }

  /** Country page: infobox must have a "Capitale" or "Gentilé" row header. */
  private checkCountry(html: string): boolean {
    return this.hasInfobox(html) && /<th[^>]*>\s*(Capitale|Gentilé)\s*<\/th>/i.test(html);
  }

  /** Main image: a Wikimedia thumbnail must appear inside the infobox area. */
  private checkHasMainImage(html: string): boolean {
    return /<img[^>]+src="[^"]*\/thumb\/[^"]*"/i.test(this.infoboxArea(html));
  }

  /**
   * Artist page: infobox has an "Activité" or "Profession" row AND the
   * infobox area contains an artist-related keyword.
   */
  private checkArtist(html: string): boolean {
    if (!this.hasInfobox(html)) return false;
    if (!/<th[^>]*>\s*(Activité|Profession)\s*<\/th>/i.test(html)) return false;
    return /\b(chanteur|chanteuse|musicien|musicienne|acteur|actrice|peintre|compositeur|compositrice|artiste)\b/i.test(
      stripHtml(this.infoboxArea(html)),
    );
  }

  /** Sportsperson: infobox has a "Sport" row header (universal on French WP athlete pages). */
  private checkSportsperson(html: string): boolean {
    return this.hasInfobox(html) && /<th[^>]*>\s*Sport\s*<\/th>/i.test(html);
  }

  /**
   * City / commune: the table carries the CSS class "commune" (French WP standard),
   * or the infobox has a "Code postal" row header as fallback.
   */
  private checkCity(html: string): boolean {
    if (/<table[^>]*class="[^"]*\bcommune\b[^"]*"/i.test(html)) return true;
    return this.hasInfobox(html) && /<th[^>]*>\s*Code postal\s*<\/th>/i.test(html);
  }

  /** 10+ Wikimedia thumbnail images (excludes small icons and flags). */
  private checkManyImages(html: string): boolean {
    return (html.match(/<img[^>]+src="[^"]*\/thumb\/[^"]*"/gi) ?? []).length >= 10;
  }

  /** Film or series: infobox has a "Réalisation", "Réalisateur", "Chaîne" or "Créateur" row. */
  private checkFilmOrSeries(html: string): boolean {
    return (
      this.hasInfobox(html) &&
      /<th[^>]*>\s*(Réalisation|Réalisateur|Chaîne|Créateur)\s*<\/th>/i.test(html)
    );
  }

  /**
   * Science article: the first paragraph's text mentions a scientific discipline.
   * Using only the lede avoids matching biographies of scientists.
   */
  private checkScience(html: string): boolean {
    const firstP = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[0] ?? '';
    return /\b(mathématiques|physique|chimie|biologie|astronomie|géologie|mécanique|thermodynamique)\b/i.test(
      stripHtml(firstP),
    );
  }

  checkBingoWin(player: Player, game: GameSession): boolean {
    if (game.mode !== GameMode.BINGO || !game.bingoConstraintIds) return false;
    return player.bingoValidated.length >= game.bingoConstraintIds.length;
  }

  allPlayersFinished(room: Room): boolean {
    return Array.from(room.players.values()).every((p) => p.status !== PlayerStatus.CONNECTED);
  }
}
