import { Injectable } from '@nestjs/common';
import {
  Room,
  Player,
  GameStatus,
  PlayerStatus,
  GameStateDTO,
  PlayerProgressDTO,
  GameSummary,
  PlayerSummary,
  WikipediaPage,
} from '@wiki-race/shared';
import { RoomRegistryService } from '../lobby/room-registry.service';
import { WikipediaService } from '../wikipedia/wikipedia.service';
import { GameStateService } from './game-state.service';

const NAVIGATION_RATE_LIMIT_MS = 500;

function normalizeSlug(slug: string): string {
  try { return decodeURIComponent(slug); } catch { return slug; }
}

@Injectable()
export class GameService {
  constructor(
    private readonly registry: RoomRegistryService,
    private readonly wikipedia: WikipediaService,
    private readonly gameState: GameStateService,
  ) {}

  async confirmChoices(
    roomCode: string,
    socketId: string,
    timeLimitSeconds: number | null,
    onTimerExpire: (summary: GameSummary) => void,
    chosenStartSlug?: string,
    chosenTargetSlug?: string,
  ): Promise<{ gameStateDTO: GameStateDTO; startPage: WikipediaPage }> {
    const room = this.getRoom(roomCode);
    if (room.chooserSocketId !== socketId) throw new Error('NOT_CHOOSER');
    if (room.status !== GameStatus.CHOOSING) throw new Error('NOT_IN_CHOOSING_PHASE');
    return this.runStartGame(room, timeLimitSeconds, onTimerExpire, chosenStartSlug, chosenTargetSlug);
  }

  private async runStartGame(
    room: Room,
    timeLimitSeconds: number | null,
    onTimerExpire: (summary: GameSummary) => void,
    chosenStartSlug?: string,
    chosenTargetSlug?: string,
  ): Promise<{ gameStateDTO: GameStateDTO; startPage: WikipediaPage }> {
    // Reset players who finished or surrendered in a previous game
    for (const player of room.players.values()) {
      if (
        player.status === PlayerStatus.FINISHED ||
        player.status === PlayerStatus.SURRENDERED
      ) {
        player.status = PlayerStatus.CONNECTED;
      }
    }

    const random = this.wikipedia.selectStartAndTarget();
    const start = normalizeSlug(chosenStartSlug ?? random.start);
    const target = normalizeSlug(chosenTargetSlug ?? random.target);
    const startPage = await this.wikipedia.fetchPage(start);
    const now = Date.now();

    room.status = GameStatus.IN_PROGRESS;
    room.chooserSocketId = null;
    room.game = {
      startSlug: start,
      targetSlug: target,
      startTime: now,
      endTime: null,
      timeLimitSeconds,
      winnerSocketId: null,
      timerHandle: null,
    };

    // Place all connected players on the start page
    for (const player of room.players.values()) {
      if (player.status === PlayerStatus.CONNECTED) {
        player.currentSlug = start;
        player.history = [];
        player.lastNavigationAt = 0;
      }
    }

    if (timeLimitSeconds !== null) {
      this.gameState.startGameTimer(room.code, timeLimitSeconds, () => {
        const summary = this.buildSummary(room);
        this.endGame(room, null);
        onTimerExpire(summary);
      });
    }

    return { gameStateDTO: this.toGameStateDTO(room), startPage };
  }

  async navigate(
    roomCode: string,
    socketId: string,
    targetSlug: string,
  ): Promise<{
    page: WikipediaPage;
    progress: PlayerProgressDTO;
    finished: boolean;
    summary?: GameSummary;
  }> {
    const room = this.getRoom(roomCode);
    if (room.status !== GameStatus.IN_PROGRESS) throw new Error('GAME_NOT_IN_PROGRESS');

    const player = room.players.get(socketId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (player.status !== PlayerStatus.CONNECTED) throw new Error('PLAYER_NOT_ACTIVE');

    const now = Date.now();
    if (now - player.lastNavigationAt < NAVIGATION_RATE_LIMIT_MS) {
      throw new Error('RATE_LIMITED');
    }

    const normalizedTarget = normalizeSlug(targetSlug);
    const valid = await this.wikipedia.isValidNavigation(player.currentSlug, normalizedTarget);
    if (!valid) throw new Error('INVALID_NAVIGATION');

    player.history.push({ from: player.currentSlug, to: normalizedTarget, timestamp: now });
    player.currentSlug = normalizedTarget;
    player.lastNavigationAt = now;

    const page = await this.wikipedia.fetchPage(normalizedTarget);
    const progress = this.toPlayerProgress(player);

    if (normalizedTarget === room.game!.targetSlug) {
      player.status = PlayerStatus.FINISHED;
      const summary = this.buildSummary(room, socketId);
      this.endGame(room, socketId);
      return { page, progress, finished: true, summary };
    }

    return { page, progress, finished: false };
  }

  surrender(roomCode: string, socketId: string): { allDone: boolean; summary?: GameSummary } {
    const room = this.getRoom(roomCode);
    if (room.status !== GameStatus.IN_PROGRESS) throw new Error('GAME_NOT_IN_PROGRESS');

    const player = room.players.get(socketId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    player.status = PlayerStatus.SURRENDERED;

    const activePlayers = Array.from(room.players.values()).filter(
      (p) => p.status === PlayerStatus.CONNECTED,
    );

    if (activePlayers.length === 0) {
      const summary = this.buildSummary(room, null);
      this.endGame(room, null);
      return { allDone: true, summary };
    }

    return { allDone: false };
  }

  toGameStateDTO(room: Room): GameStateDTO {
    return {
      roomCode: room.code,
      startSlug: room.game!.startSlug,
      targetSlug: room.game!.targetSlug,
      startTime: room.game!.startTime,
      timeLimitSeconds: room.game!.timeLimitSeconds,
      playerStatuses: Array.from(room.players.values()).map((p) => this.toPlayerProgress(p)),
    };
  }

  toPlayerProgress(player: Player): PlayerProgressDTO {
    return {
      pseudo: player.pseudo,
      status: player.status,
      hopCount: player.history.length,
      currentSlug: player.currentSlug,
    };
  }

  private endGame(room: Room, winnerSocketId: string | null): void {
    room.status = GameStatus.FINISHED;
    room.game!.endTime = Date.now();
    room.game!.winnerSocketId = winnerSocketId;
    this.gameState.clearGameTimer(room.code);
  }

  private buildSummary(room: Room, winnerSocketId?: string | null): GameSummary {
    const winnerId = winnerSocketId !== undefined ? winnerSocketId : room.game!.winnerSocketId;
    const winnerPlayer = winnerId ? room.players.get(winnerId) : null;

    const players: PlayerSummary[] = Array.from(room.players.values()).map((p) => ({
      pseudo: p.pseudo,
      isWinner: p.socketId === winnerId,
      surrendered: p.status === PlayerStatus.SURRENDERED,
      hopCount: p.history.length,
      path: p.history,
    }));

    return {
      roomCode: room.code,
      startSlug: room.game!.startSlug,
      targetSlug: room.game!.targetSlug,
      startTime: room.game!.startTime,
      endTime: room.game!.endTime ?? Date.now(),
      timeLimitSeconds: room.game!.timeLimitSeconds,
      winnerPseudo: winnerPlayer?.pseudo ?? null,
      players,
    };
  }

  private getRoom(roomCode: string): Room {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    return room;
  }
}
