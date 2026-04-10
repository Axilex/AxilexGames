import { Test, TestingModule } from '@nestjs/testing';
import { ModeService } from './mode.service';
import { DriftObjective, GameMode, PlayerStatus } from '@wiki-race/shared';
import type { Player, GameSession } from '@wiki-race/shared';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    socketId: 'socket1',
    pseudo: 'Alice',
    status: PlayerStatus.CONNECTED,
    currentSlug: 'France',
    history: [],
    lastNavigationAt: 0,
    driftBestScore: null,
    driftBestSlug: null,
    bingoValidated: [],
    bingoValidatedOnSlug: {},
    ...overrides,
  };
}

function makeGame(overrides: Partial<GameSession> = {}): GameSession {
  return {
    mode: GameMode.DRIFT,
    startSlug: 'France',
    targetSlug: null,
    startTime: Date.now(),
    endTime: null,
    timeLimitSeconds: null,
    clickLimit: 6,
    winnerSocketId: null,
    timerHandle: null,
    driftObjective: DriftObjective.OLDEST_TITLE_YEAR,
    bingoConstraintIds: null,
    ...overrides,
  };
}

describe('ModeService — Drift', () => {
  let service: ModeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModeService],
    }).compile();
    service = module.get<ModeService>(ModeService);
  });

  it('computeDriftScore OLDEST_TITLE_YEAR extracts lowest year from slug', () => {
    const score = service.computeDriftScore(
      DriftObjective.OLDEST_TITLE_YEAR,
      '',
      'Guerre_1914_1918',
    );
    expect(score).toBe(1914);
  });

  it('computeDriftScore OLDEST_TITLE_YEAR returns 9999 when no year', () => {
    const score = service.computeDriftScore(DriftObjective.OLDEST_TITLE_YEAR, '', 'Paris');
    expect(score).toBe(9999);
  });

  it('computeDriftScore SHORTEST counts words in HTML text', () => {
    const html = '<p>Hello world foo</p>';
    const score = service.computeDriftScore(DriftObjective.SHORTEST, html, 'any');
    expect(score).toBe(3);
  });

  it('computeDriftScore MOST_IMAGES counts img tags', () => {
    const html = '<img src="a"/><img src="b"/><p>no image</p><img src="c"/>';
    const score = service.computeDriftScore(DriftObjective.MOST_IMAGES, html, 'any');
    expect(score).toBe(3);
  });

  it('isBetterDriftScore OLDEST_TITLE_YEAR: lower year wins', () => {
    expect(service.isBetterDriftScore(DriftObjective.OLDEST_TITLE_YEAR, 1900, 1950)).toBe(true);
    expect(service.isBetterDriftScore(DriftObjective.OLDEST_TITLE_YEAR, 2000, 1950)).toBe(false);
  });

  it('isBetterDriftScore SHORTEST: lower count wins', () => {
    expect(service.isBetterDriftScore(DriftObjective.SHORTEST, 10, 50)).toBe(true);
    expect(service.isBetterDriftScore(DriftObjective.SHORTEST, 100, 50)).toBe(false);
  });

  it('isBetterDriftScore MOST_IMAGES: higher count wins', () => {
    expect(service.isBetterDriftScore(DriftObjective.MOST_IMAGES, 10, 5)).toBe(true);
    expect(service.isBetterDriftScore(DriftObjective.MOST_IMAGES, 2, 5)).toBe(false);
  });

  it('isBetterDriftScore returns true when current is null', () => {
    expect(service.isBetterDriftScore(DriftObjective.OLDEST_TITLE_YEAR, 1800, null)).toBe(true);
  });

  it('rankDriftPlayers sorts by score correctly (OLDEST_TITLE_YEAR)', () => {
    const p1 = makePlayer({ pseudo: 'Alice', driftBestScore: 1800 });
    const p2 = makePlayer({ pseudo: 'Bob', driftBestScore: 1950 });
    const p3 = makePlayer({ pseudo: 'Carl', driftBestScore: null });
    const ranked = service.rankDriftPlayers([p2, p3, p1], DriftObjective.OLDEST_TITLE_YEAR);
    expect(ranked.map((p) => p.pseudo)).toEqual(['Alice', 'Bob', 'Carl']);
  });

  it('rankDriftPlayers places null scores last', () => {
    const p1 = makePlayer({ pseudo: 'Alice', driftBestScore: null });
    const p2 = makePlayer({ pseudo: 'Bob', driftBestScore: 2000 });
    const ranked = service.rankDriftPlayers([p1, p2], DriftObjective.OLDEST_TITLE_YEAR);
    expect(ranked[0].pseudo).toBe('Bob');
    expect(ranked[1].pseudo).toBe('Alice');
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
    const html =
      '<table class="infobox"><tr><th>Naissance</th><td>5 juin 1980</td></tr></table>';
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

  it('checkConstraints - many_images counts 10+ thumbnail img tags', () => {
    const img = '<img src="https://upload.wikimedia.org/thumb/a.jpg"/>';
    const html = img.repeat(10);
    const validated = service.checkConstraints(['many_images'], 'any', html);
    expect(validated).toContain('many_images');
  });

  it('checkConstraints - many_images false when < 10 thumbnail images', () => {
    const img = '<img src="https://upload.wikimedia.org/thumb/a.jpg"/>';
    const html = img.repeat(5);
    const validated = service.checkConstraints(['many_images'], 'any', html);
    expect(validated).not.toContain('many_images');
  });

  it('checkConstraints - returns only matching constraints from given subset', () => {
    const img = '<img src="https://upload.wikimedia.org/thumb/a.jpg"/>';
    const html = img.repeat(10);
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
