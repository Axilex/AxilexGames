import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { GameStateService } from './game-state.service';
import { RoomRegistryService } from '../lobby/room-registry.service';
import { LobbyService } from '../lobby/lobby.service';
import { WikipediaService } from '../wikipedia/wikipedia.service';
import { GameStatus } from '@wiki-race/shared';

const mockWikipediaService = {
  selectStartAndTarget: jest.fn().mockReturnValue({ start: 'France', target: 'Tour_Eiffel' }),
  fetchPage: jest.fn().mockResolvedValue({
    slug: 'France',
    title: 'France',
    htmlContent: '<a href="/wiki/Tour_Eiffel">Tour Eiffel</a><a href="/wiki/Paris">Paris</a>',
  }),
  isValidNavigation: jest.fn().mockResolvedValue(true),
};

async function setup() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GameService,
      GameStateService,
      RoomRegistryService,
      LobbyService,
      { provide: WikipediaService, useValue: mockWikipediaService },
    ],
  }).compile();

  return {
    gameService: module.get<GameService>(GameService),
    lobbyService: module.get<LobbyService>(LobbyService),
  };
}

describe('GameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWikipediaService.selectStartAndTarget.mockReturnValue({
      start: 'France',
      target: 'Tour_Eiffel',
    });
    mockWikipediaService.fetchPage.mockResolvedValue({
      slug: 'France',
      title: 'France',
      htmlContent: '<a href="/wiki/Tour_Eiffel">Tour Eiffel</a><a href="/wiki/Paris">Paris</a>',
    });
    mockWikipediaService.isValidNavigation.mockResolvedValue(true);
  });

  it('starts a game and places all players on the start page', async () => {
    const { gameService, lobbyService } = await setup();
    const { room, code } = lobbyService.createRoom('Alice', 'socket1');
    lobbyService.joinRoom(code, 'Bob', 'socket2');

    const noop = jest.fn();
    const { gameStateDTO } = await gameService.startGame(code, 'socket1', null, noop);

    expect(room.status).toBe(GameStatus.IN_PROGRESS);
    expect(gameStateDTO.startSlug).toBe('France');
    expect(gameStateDTO.targetSlug).toBe('Tour_Eiffel');
    expect(room.players.get('socket1')!.currentSlug).toBe('France');
    expect(room.players.get('socket2')!.currentSlug).toBe('France');
  });

  it('rejects game start from non-host', async () => {
    const { gameService, lobbyService } = await setup();
    const { code } = lobbyService.createRoom('Alice', 'socket1');
    lobbyService.joinRoom(code, 'Bob', 'socket2');

    await expect(gameService.startGame(code, 'socket2', null, jest.fn())).rejects.toThrow(
      'NOT_HOST',
    );
  });

  it('rejects game start if already started', async () => {
    const { gameService, lobbyService } = await setup();
    const { room, code } = lobbyService.createRoom('Alice', 'socket1');
    room.status = GameStatus.IN_PROGRESS;

    await expect(gameService.startGame(code, 'socket1', null, jest.fn())).rejects.toThrow(
      'GAME_ALREADY_STARTED',
    );
  });

  it('handles a valid navigation step', async () => {
    const { gameService, lobbyService } = await setup();
    const { code } = lobbyService.createRoom('Alice', 'socket1');
    await gameService.startGame(code, 'socket1', null, jest.fn());

    const result = await gameService.navigate(code, 'socket1', 'Paris');
    expect(result.finished).toBe(false);
    expect(result.progress.hopCount).toBe(1);
    expect(result.progress.currentSlug).toBe('Paris');
  });

  it('detects win when player reaches target slug', async () => {
    const { gameService, lobbyService } = await setup();
    const { code } = lobbyService.createRoom('Alice', 'socket1');
    await gameService.startGame(code, 'socket1', null, jest.fn());

    const result = await gameService.navigate(code, 'socket1', 'Tour_Eiffel');
    expect(result.finished).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summary!.winnerPseudo).toBe('Alice');
  });

  it('rejects invalid navigation', async () => {
    const { gameService, lobbyService } = await setup();
    const { code } = lobbyService.createRoom('Alice', 'socket1');
    await gameService.startGame(code, 'socket1', null, jest.fn());

    mockWikipediaService.isValidNavigation.mockResolvedValue(false);
    await expect(gameService.navigate(code, 'socket1', 'Allemagne')).rejects.toThrow(
      'INVALID_NAVIGATION',
    );
  });

  it('rejects navigation when game is not in progress', async () => {
    const { gameService, lobbyService } = await setup();
    const { code } = lobbyService.createRoom('Alice', 'socket1');

    await expect(gameService.navigate(code, 'socket1', 'Paris')).rejects.toThrow(
      'GAME_NOT_IN_PROGRESS',
    );
  });

  it('surrenders a player without ending game if others are active', async () => {
    const { gameService, lobbyService } = await setup();
    const { code } = lobbyService.createRoom('Alice', 'socket1');
    lobbyService.joinRoom(code, 'Bob', 'socket2');
    await gameService.startGame(code, 'socket1', null, jest.fn());

    const result = gameService.surrender(code, 'socket2');
    expect(result.allDone).toBe(false);
    expect(result.summary).toBeUndefined();
  });

  it('ends game with no winner when all players surrender', async () => {
    const { gameService, lobbyService } = await setup();
    const { code } = lobbyService.createRoom('Alice', 'socket1');
    lobbyService.joinRoom(code, 'Bob', 'socket2');
    await gameService.startGame(code, 'socket1', null, jest.fn());

    gameService.surrender(code, 'socket1');
    const result = gameService.surrender(code, 'socket2');

    expect(result.allDone).toBe(true);
    expect(result.summary!.winnerPseudo).toBeNull();
  });

  it('stores timeLimitSeconds in the game session', async () => {
    const { gameService, lobbyService } = await setup();
    const { room, code } = lobbyService.createRoom('Alice', 'socket1');
    await gameService.startGame(code, 'socket1', 300, jest.fn());
    expect(room.game!.timeLimitSeconds).toBe(300);
  });

  it('builds a summary with full path history', async () => {
    const { gameService, lobbyService } = await setup();
    const { code } = lobbyService.createRoom('Alice', 'socket1');
    await gameService.startGame(code, 'socket1', null, jest.fn());

    await gameService.navigate(code, 'socket1', 'Paris');

    // Force lastNavigationAt to bypass rate limit
    const lobby = lobbyService['registry'];
    const room = lobby.findRoom(code)!;
    room.players.get('socket1')!.lastNavigationAt = 0;

    const result = await gameService.navigate(code, 'socket1', 'Tour_Eiffel');
    expect(result.summary!.players[0].path).toHaveLength(2);
  });
});
