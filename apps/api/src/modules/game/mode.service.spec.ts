import { Test, TestingModule } from '@nestjs/testing';
import { ModeService } from './mode.service';
import { GameMode, PlayerStatus } from '@wiki-race/shared';
import type { Player, GameSession } from '@wiki-race/shared';

// ─── HTML helpers ────────────────────────────────────────────────────────────
function infoboxWith(...rows: string[]): string {
  const thRows = rows.map((r) => `<tr><th>${r}</th><td>value</td></tr>`).join('');
  return `<table class="infobox">${thRows}</table>`;
}
function infoboxWithContent(rows: string[], extraContent: string): string {
  const thRows = rows.map((r) => `<tr><th>${r}</th><td>${extraContent}</td></tr>`).join('');
  return `<table class="infobox">${thRows}</table>`;
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    socketId: 'socket1',
    pseudo: 'Alice',
    status: PlayerStatus.CONNECTED,
    currentSlug: 'France',
    history: [],
    lastNavigationAt: 0,
    bingoValidated: [],
    bingoValidatedOnSlug: {},
    ...overrides,
  };
}

function makeGame(overrides: Partial<GameSession> = {}): GameSession {
  return {
    mode: GameMode.BINGO,
    startSlug: 'France',
    targetSlug: null,
    startTime: Date.now(),
    endTime: null,
    timeLimitSeconds: null,
    clickLimit: 6,
    winnerSocketId: null,
    timerHandle: null,
    bingoConstraintIds: null,
    ...overrides,
  };
}

describe('ModeService — detectPageCategory', () => {
  let service: ModeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModeService],
    }).compile();
    service = module.get<ModeService>(ModeService);
  });

  it('SPORTSPERSON when infobox has Sport row', () => {
    expect(service.detectPageCategory(infoboxWith('Sport'))).toBe('SPORTSPERSON');
  });

  it('SPORTSPERSON takes priority over PERSON when both Sport and Naissance present', () => {
    expect(service.detectPageCategory(infoboxWith('Sport', 'Naissance'))).toBe('SPORTSPERSON');
  });

  it('ARTIST when infobox has Activité row + artist keyword in content', () => {
    const html = infoboxWithContent(['Activité'], 'chanteur, compositeur');
    expect(service.detectPageCategory(html)).toBe('ARTIST');
  });

  it('ARTIST takes priority over PERSON when Activité+keyword and Naissance present', () => {
    const html = `<table class="infobox">
      <tr><th>Naissance</th><td>1980</td></tr>
      <tr><th>Activité</th><td>actrice</td></tr>
    </table>`;
    expect(service.detectPageCategory(html)).toBe('ARTIST');
  });

  it('PERSON when infobox has Naissance row (no Sport, no artist keyword)', () => {
    expect(service.detectPageCategory(infoboxWith('Naissance'))).toBe('PERSON');
  });

  it('COUNTRY when infobox has Capitale row', () => {
    expect(service.detectPageCategory(infoboxWith('Capitale'))).toBe('COUNTRY');
  });

  it('COUNTRY when infobox has Gentilé row', () => {
    expect(service.detectPageCategory(infoboxWith('Gentilé'))).toBe('COUNTRY');
  });

  it('CITY when table has class commune', () => {
    expect(
      service.detectPageCategory('<table class="commune"><tr><td>Lyon</td></tr></table>'),
    ).toBe('CITY');
  });

  it('CITY when infobox has Code postal row', () => {
    expect(service.detectPageCategory(infoboxWith('Code postal'))).toBe('CITY');
  });

  it('FILM_SERIES when infobox has Réalisation row', () => {
    expect(service.detectPageCategory(infoboxWith('Réalisation'))).toBe('FILM_SERIES');
  });

  it('FILM_SERIES when infobox has Chaîne row', () => {
    expect(service.detectPageCategory(infoboxWith('Chaîne'))).toBe('FILM_SERIES');
  });

  it('SCIENCE when first paragraph mentions a scientific discipline (no infobox)', () => {
    const html = '<p>La <b>physique</b> est une science fondamentale.</p>';
    expect(service.detectPageCategory(html)).toBe('SCIENCE');
  });

  it('SCIENCE when first paragraph mentions discipline even with unrelated infobox', () => {
    const html = "<p>La <b>chimie</b> est l'étude des substances.</p>" + infoboxWith('Auteur');
    expect(service.detectPageCategory(html)).toBe('SCIENCE');
  });

  it('UNKNOWN when no recognizable signals', () => {
    expect(service.detectPageCategory(infoboxWith('Auteur', 'Éditeur'))).toBe('UNKNOWN');
  });

  it('UNKNOWN when no infobox and no science keyword', () => {
    expect(service.detectPageCategory('<p>Un article quelconque.</p>')).toBe('UNKNOWN');
  });

  it('does not return ARTIST for Activité row without artist keyword', () => {
    const html = infoboxWithContent(['Activité'], 'ingénieur civil');
    expect(service.detectPageCategory(html)).toBe('UNKNOWN');
  });
});

describe('ModeService — Bingo', () => {
  let service: ModeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModeService],
    }).compile();
    service = module.get<ModeService>(ModeService);
  });

  it('checkConstraints - year_in_title matches slug with 4-digit year', () => {
    const validated = service.checkConstraints(['year_in_title'], 'Révolution_1789', '');
    expect(validated).toContain('year_in_title');
  });

  it('checkConstraints - year_in_title does not match slug without year', () => {
    const validated = service.checkConstraints(['year_in_title'], 'Paris', '');
    expect(validated).not.toContain('year_in_title');
  });

  it('checkConstraints - biographical finds Naissance in infobox', () => {
    const html = '<table class="infobox"><tr><th>Naissance</th><td>5 juin 1980</td></tr></table>';
    const validated = service.checkConstraints(['biographical'], 'any', html);
    expect(validated).toContain('biographical');
  });

  it('checkConstraints - biographical does not match without infobox', () => {
    const validated = service.checkConstraints(
      ['biographical'],
      'any',
      '<p>Naissance le 5 juin 1980.</p>',
    );
    expect(validated).not.toContain('biographical');
  });

  it('checkConstraints - country finds Capitale in infobox', () => {
    const html = '<table class="infobox"><tr><th>Capitale</th><td>Paris</td></tr></table>';
    const validated = service.checkConstraints(['country'], 'any', html);
    expect(validated).toContain('country');
  });

  it('checkConstraints - country finds Gentilé in infobox', () => {
    const html = '<table class="infobox"><tr><th>Gentilé</th><td>Français</td></tr></table>';
    const validated = service.checkConstraints(['country'], 'any', html);
    expect(validated).toContain('country');
  });

  it('checkConstraints - country does not match without infobox', () => {
    const validated = service.checkConstraints(['country'], 'any', '<p>La France est grande.</p>');
    expect(validated).not.toContain('country');
  });

  it('checkConstraints - has_main_image finds thumb img in infobox', () => {
    const html =
      '<table class="infobox"><tr><td><img src="https://upload.wikimedia.org/thumb/photo.jpg"/></td></tr></table>';
    const validated = service.checkConstraints(['has_main_image'], 'any', html);
    expect(validated).toContain('has_main_image');
  });

  it('checkConstraints - has_main_image does not match without infobox', () => {
    const html = '<p><img src="https://upload.wikimedia.org/thumb/photo.jpg"/></p>';
    const validated = service.checkConstraints(['has_main_image'], 'any', html);
    expect(validated).not.toContain('has_main_image');
  });

  it('checkConstraints - artist matches Activité + artist keyword', () => {
    const html =
      '<table class="infobox"><tr><th>Activité</th><td>chanteur, compositeur</td></tr></table>';
    const validated = service.checkConstraints(['artist'], 'any', html);
    expect(validated).toContain('artist');
  });

  it('checkConstraints - artist does not match without artist keyword', () => {
    const html =
      '<table class="infobox"><tr><th>Activité</th><td>ingénieur civil</td></tr></table>';
    const validated = service.checkConstraints(['artist'], 'any', html);
    expect(validated).not.toContain('artist');
  });

  it('checkConstraints - artist does not match without infobox', () => {
    const validated = service.checkConstraints(
      ['artist'],
      'any',
      '<p>Il est chanteur professionnel.</p>',
    );
    expect(validated).not.toContain('artist');
  });

  it('checkConstraints - sportsperson finds Sport in infobox', () => {
    const html = '<table class="infobox"><tr><th>Sport</th><td>Football</td></tr></table>';
    const validated = service.checkConstraints(['sportsperson'], 'any', html);
    expect(validated).toContain('sportsperson');
  });

  it('checkConstraints - sportsperson does not match without Sport row', () => {
    const html = '<table class="infobox"><tr><th>Naissance</th><td>1990</td></tr></table>';
    const validated = service.checkConstraints(['sportsperson'], 'any', html);
    expect(validated).not.toContain('sportsperson');
  });

  it('checkConstraints - city matches commune class', () => {
    const html = '<table class="commune"><tr><td>Lyon</td></tr></table>';
    const validated = service.checkConstraints(['city'], 'any', html);
    expect(validated).toContain('city');
  });

  it('checkConstraints - city matches Code postal in infobox', () => {
    const html = '<table class="infobox"><tr><th>Code postal</th><td>75001</td></tr></table>';
    const validated = service.checkConstraints(['city'], 'any', html);
    expect(validated).toContain('city');
  });

  it('checkConstraints - city does not match without commune or Code postal', () => {
    const html = '<table class="infobox"><tr><th>Population</th><td>1M</td></tr></table>';
    const validated = service.checkConstraints(['city'], 'any', html);
    expect(validated).not.toContain('city');
  });

  it('checkConstraints - many_images counts 5+ thumbnail img tags', () => {
    const img = '<img src="https://upload.wikimedia.org/thumb/a.jpg"/>';
    const html = img.repeat(5);
    const validated = service.checkConstraints(['many_images'], 'any', html);
    expect(validated).toContain('many_images');
  });

  it('checkConstraints - many_images false when < 5 thumbnail images', () => {
    const img = '<img src="https://upload.wikimedia.org/thumb/a.jpg"/>';
    const html = img.repeat(4);
    const validated = service.checkConstraints(['many_images'], 'any', html);
    expect(validated).not.toContain('many_images');
  });

  it('checkConstraints - film_or_series finds Réalisation in infobox', () => {
    const html = '<table class="infobox"><tr><th>Réalisation</th><td>Spielberg</td></tr></table>';
    const validated = service.checkConstraints(['film_or_series'], 'any', html);
    expect(validated).toContain('film_or_series');
  });

  it('checkConstraints - film_or_series finds Chaîne in infobox', () => {
    const html = '<table class="infobox"><tr><th>Chaîne</th><td>TF1</td></tr></table>';
    const validated = service.checkConstraints(['film_or_series'], 'any', html);
    expect(validated).toContain('film_or_series');
  });

  it('checkConstraints - film_or_series does not match without infobox', () => {
    const validated = service.checkConstraints(
      ['film_or_series'],
      'any',
      '<p>Réalisation exceptionnelle.</p>',
    );
    expect(validated).not.toContain('film_or_series');
  });

  it('checkConstraints - science finds discipline in first paragraph', () => {
    const html = '<p>La <b>physique</b> est une science fondamentale.</p>';
    const validated = service.checkConstraints(['science'], 'any', html);
    expect(validated).toContain('science');
  });

  it('checkConstraints - science does not match when discipline only in body', () => {
    const html =
      '<p>Albert Einstein est un scientifique célèbre.</p><p>Il a travaillé en physique.</p>';
    const validated = service.checkConstraints(['science'], 'any', html);
    expect(validated).not.toContain('science');
  });

  it('checkConstraints - returns only matching constraints from given subset', () => {
    const img = '<img src="https://upload.wikimedia.org/thumb/a.jpg"/>';
    const html = img.repeat(5);
    const validated = service.checkConstraints(['many_images', 'biographical'], 'any', html);
    expect(validated).toContain('many_images');
    expect(validated).not.toContain('biographical');
  });

  it('checkBingoWin returns true when all selected constraints validated', () => {
    const player = makePlayer({ bingoValidated: ['year_in_title', 'city'] });
    const game = makeGame({
      mode: GameMode.BINGO,
      bingoConstraintIds: ['year_in_title', 'city'],
    });
    expect(service.checkBingoWin(player, game)).toBe(true);
  });

  it('checkBingoWin returns false when partial validation', () => {
    const player = makePlayer({ bingoValidated: ['year_in_title'] });
    const game = makeGame({
      mode: GameMode.BINGO,
      bingoConstraintIds: ['year_in_title', 'city'],
    });
    expect(service.checkBingoWin(player, game)).toBe(false);
  });

  it('allPlayersFinished returns true when no CONNECTED player remains', () => {
    const players = new Map([
      ['s1', makePlayer({ status: PlayerStatus.FINISHED })],
      ['s2', makePlayer({ status: PlayerStatus.SURRENDERED })],
    ]);
    const room = { players } as any;
    expect(service.allPlayersFinished(room)).toBe(true);
  });

  it('allPlayersFinished returns false when a CONNECTED player remains', () => {
    const players = new Map([
      ['s1', makePlayer({ status: PlayerStatus.FINISHED })],
      ['s2', makePlayer({ status: PlayerStatus.CONNECTED })],
    ]);
    const room = { players } as any;
    expect(service.allPlayersFinished(room)).toBe(false);
  });
});
