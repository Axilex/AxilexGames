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

  private checkYearInTitle(slug: string): boolean {
    return /\b\d{4}\b/.test(normalizeSlug(slug));
  }

  private checkBiographical(html: string): boolean {
    return /naissance|décès/i.test(stripHtml(html));
  }

  private checkCountry(html: string): boolean {
    // Check in the first table (infobox area)
    const infobox = html.match(/<table[\s\S]*?<\/table>/i)?.[0] ?? html;
    return /\b(pays|republic|royaume|état|kingdom|state)\b/i.test(stripHtml(infobox));
  }

  private checkHasMainImage(html: string): boolean {
    const infoboxOrFigure =
      html.match(/<table[\s\S]*?<\/table>/i)?.[0] ??
      html.match(/<figure[\s\S]*?<\/figure>/i)?.[0] ??
      '';
    return /<img/i.test(infoboxOrFigure);
  }

  private checkArtist(html: string): boolean {
    return /chanteu|musicien|acteur|peintre|artiste/i.test(stripHtml(html));
  }

  private checkSportsperson(html: string): boolean {
    return /footballeur|tennisman|athlète|nageur|basketteur/i.test(stripHtml(html));
  }

  private checkCity(html: string): boolean {
    return /\b(commune|municipality|ville)\b/i.test(stripHtml(html));
  }

  private checkManyImages(html: string): boolean {
    return (html.match(/<img/g) ?? []).length >= 5;
  }

  private checkFilmOrSeries(html: string): boolean {
    return /\bfilm\b|série télévisée/i.test(stripHtml(html));
  }

  private checkScience(html: string): boolean {
    return /mathématiques|physique|chimie|biologie/i.test(stripHtml(html));
  }

  checkBingoWin(player: Player, game: GameSession): boolean {
    if (game.mode !== GameMode.BINGO || !game.bingoConstraintIds) return false;
    return player.bingoValidated.length >= game.bingoConstraintIds.length;
  }

  allPlayersFinished(room: Room): boolean {
    return Array.from(room.players.values()).every((p) => p.status !== PlayerStatus.CONNECTED);
  }
}
