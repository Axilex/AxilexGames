import { Injectable } from '@nestjs/common';
import {
  Room,
  Player,
  GameSession,
  GameStatus,
  PlayerStatus,
  GameMode,
  GameStateDTO,
  PlayerProgressDTO,
  GameSummary,
  PlayerSummary,
  WikipediaPage,
} from '@wiki-race/shared';
import { BingoConstraintId, BingoCardEntry } from '@wiki-race/shared';
import { RoomRegistryService } from '../lobby/room-registry.service';
import { WikipediaService } from '../wikipedia/wikipedia.service';
import { RoomTimerService } from '../../common/game-room';
import { ModeService } from './mode.service';

const NAVIGATION_RATE_LIMIT_MS = 500;

function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

@Injectable()
export class GameService {
  constructor(
    private readonly registry: RoomRegistryService,
    private readonly wikipedia: WikipediaService,
    private readonly timer: RoomTimerService,
    private readonly modeService: ModeService,
  ) {}

  async confirmChoices(
    roomCode: string,
    socketId: string,
    mode: GameMode = GameMode.CLASSIC,
    timeLimitSeconds: number | null,
    onTimerExpire: (summary: GameSummary) => void,
    clickLimit?: number | null,
    chosenStartSlug?: string,
    chosenTargetSlug?: string,
    bingoConstraintIds?: BingoConstraintId[],
  ): Promise<{ gameStateDTO: GameStateDTO; startPage: WikipediaPage }> {
    const room = this.getRoom(roomCode);
    if (room.chooserSocketId !== socketId) throw new Error('NOT_CHOOSER');
    if (room.status !== GameStatus.CHOOSING) throw new Error('NOT_IN_CHOOSING_PHASE');
    return this.runStartGame(
      room,
      mode,
      timeLimitSeconds,
      onTimerExpire,
      clickLimit,
      chosenStartSlug,
      chosenTargetSlug,
      bingoConstraintIds,
    );
  }

  private async runStartGame(
    room: Room,
    mode: GameMode,
    timeLimitSeconds: number | null,
    onTimerExpire: (summary: GameSummary) => void,
    clickLimit?: number | null,
    chosenStartSlug?: string,
    chosenTargetSlug?: string,
    bingoConstraintIds?: BingoConstraintId[],
  ): Promise<{ gameStateDTO: GameStateDTO; startPage: WikipediaPage }> {
    // Reset players from previous game
    for (const player of room.players.values()) {
      if (player.status === PlayerStatus.FINISHED || player.status === PlayerStatus.SURRENDERED) {
        player.status = PlayerStatus.CONNECTED;
      }
    }

    const needsTarget = mode === GameMode.CLASSIC;
    const random = this.wikipedia.selectStartAndTarget();
    const start = normalizeSlug(chosenStartSlug ?? random.start);
    const target = needsTarget ? normalizeSlug(chosenTargetSlug ?? random.target) : null;
    const startPage = await this.wikipedia.fetchPage(start);
    const now = Date.now();

    room.status = GameStatus.IN_PROGRESS;
    room.chooserSocketId = null;
    room.game = {
      mode,
      startSlug: start,
      targetSlug: target,
      startTime: now,
      endTime: null,
      timeLimitSeconds,
      clickLimit: clickLimit ?? null,
      winnerSocketId: null,
      bingoConstraintIds: bingoConstraintIds ?? null,
    };

    // Place all connected players on the start page
    for (const player of room.players.values()) {
      if (player.status === PlayerStatus.CONNECTED) {
        player.currentSlug = start;
        player.history = [];
        player.lastNavigationAt = 0;
        player.bingoValidated = [];
        player.bingoValidatedOnSlug = {};
      }
    }

    if (timeLimitSeconds !== null) {
      this.timer.start(room.code, 'game', timeLimitSeconds * 1000, () => {
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
    newlyValidated?: BingoConstraintId[];
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
    const game = room.game!;

    switch (game.mode) {
      case GameMode.CLASSIC: {
        if (normalizedTarget === game.targetSlug) {
          player.status = PlayerStatus.FINISHED;
          const summary = this.buildSummary(room, socketId);
          this.endGame(room, socketId);
          return { page, progress: this.toPlayerProgress(player, game), finished: true, summary };
        }
        break;
      }

      case GameMode.BINGO: {
        let newlyValidated: BingoConstraintId[] = [];
        if (game.bingoConstraintIds) {
          const unvalidated = game.bingoConstraintIds.filter(
            (id) => !player.bingoValidated.includes(id),
          );
          newlyValidated = this.modeService.checkConstraints(
            unvalidated,
            normalizedTarget,
            page.htmlContent,
          );
          for (const id of newlyValidated) {
            player.bingoValidated.push(id);
            player.bingoValidatedOnSlug[id] = normalizedTarget;
          }
        }

        if (this.modeService.checkBingoWin(player, game)) {
          player.status = PlayerStatus.FINISHED;
          const summary = this.buildSummary(room, socketId);
          this.endGame(room, socketId);
          return {
            page,
            progress: this.toPlayerProgress(player, game),
            finished: true,
            summary,
            newlyValidated,
          };
        }

        if (game.clickLimit !== null && player.history.length >= game.clickLimit) {
          player.status = PlayerStatus.FINISHED;
          if (this.modeService.allPlayersFinished(room)) {
            const summary = this.buildSummary(room, null);
            this.endGame(room, null);
            return {
              page,
              progress: this.toPlayerProgress(player, game),
              finished: true,
              summary,
              newlyValidated,
            };
          }
          return {
            page,
            progress: this.toPlayerProgress(player, game),
            finished: true,
            newlyValidated,
          };
        }

        return {
          page,
          progress: this.toPlayerProgress(player, game),
          finished: false,
          newlyValidated,
        };
      }
    }

    return { page, progress: this.toPlayerProgress(player, game), finished: false };
  }

  surrender(roomCode: string, socketId: string): { allDone: boolean; summary?: GameSummary } {
    const room = this.getRoom(roomCode);
    if (room.status !== GameStatus.IN_PROGRESS) throw new Error('GAME_NOT_IN_PROGRESS');

    const player = room.players.get(socketId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    player.status = PlayerStatus.SURRENDERED;

    if (this.modeService.allPlayersFinished(room)) {
      const summary = this.buildSummary(room, null);
      this.endGame(room, null);
      return { allDone: true, summary };
    }

    return { allDone: false };
  }

  toGameStateDTO(room: Room): GameStateDTO {
    const game = room.game!;
    return {
      roomCode: room.code,
      mode: game.mode,
      startSlug: game.startSlug,
      targetSlug: game.targetSlug,
      startTime: game.startTime,
      timeLimitSeconds: game.timeLimitSeconds,
      clickLimit: game.clickLimit,
      bingoConstraints: game.bingoConstraintIds,
      playerStatuses: Array.from(room.players.values()).map((p) => this.toPlayerProgress(p, game)),
    };
  }

  toPlayerProgress(player: Player, game: GameSession | null): PlayerProgressDTO {
    const clicksLeft =
      game?.clickLimit != null ? Math.max(0, game.clickLimit - player.history.length) : null;
    return {
      pseudo: player.pseudo,
      status: player.status,
      hopCount: player.history.length,
      currentSlug: player.currentSlug,
      clicksLeft,
      bingoValidated: player.bingoValidated,
    };
  }

  private endGame(room: Room, winnerSocketId: string | null): void {
    room.status = GameStatus.FINISHED;
    room.game!.endTime = Date.now();
    room.game!.winnerSocketId = winnerSocketId;
    this.timer.clear(room.code, 'game');
  }

  private buildSummary(room: Room, winnerSocketId?: string | null): GameSummary {
    const game = room.game!;
    const winnerId = winnerSocketId !== undefined ? winnerSocketId : game.winnerSocketId;

    const players: PlayerSummary[] = Array.from(room.players.values()).map((p) => {
      const bingoCardEntries: BingoCardEntry[] = (game.bingoConstraintIds ?? []).map((cid) => ({
        constraintId: cid,
        validated: p.bingoValidated.includes(cid),
        validatedOnSlug: p.bingoValidatedOnSlug[cid] ?? null,
      }));

      return {
        pseudo: p.pseudo,
        isWinner: p.socketId === winnerId,
        surrendered: p.status === PlayerStatus.SURRENDERED,
        hopCount: p.history.length,
        path: p.history,
        rank: null,
        bingoValidated: p.bingoValidated,
        bingoCardEntries,
      };
    });

    let resolvedWinnerPseudo: string | null = winnerId
      ? (room.players.get(winnerId)?.pseudo ?? null)
      : null;

    if (game.mode === GameMode.BINGO) {
      const ranked = [...players].sort((a, b) => {
        const diff = b.bingoValidated.length - a.bingoValidated.length;
        return diff !== 0 ? diff : a.hopCount - b.hopCount;
      });
      ranked.forEach((p, idx) => {
        p.rank = idx + 1;
      });
      resolvedWinnerPseudo = ranked[0]?.pseudo ?? null;
      players.forEach((p) => {
        p.isWinner = p.pseudo === resolvedWinnerPseudo;
      });
    }

    return {
      roomCode: room.code,
      mode: game.mode,
      startSlug: game.startSlug,
      targetSlug: game.targetSlug,
      startTime: game.startTime,
      endTime: game.endTime ?? Date.now(),
      timeLimitSeconds: game.timeLimitSeconds,
      clickLimit: game.clickLimit,
      winnerPseudo: resolvedWinnerPseudo,
      bingoConstraintIds: game.bingoConstraintIds,
      players,
    };
  }

  buildSummaryPublic(room: Room): GameSummary {
    return this.buildSummary(room);
  }

  private getRoom(roomCode: string): Room {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    return room;
  }
}
