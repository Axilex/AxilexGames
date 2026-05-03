import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from '../../src/app.module';
import { WikipediaService } from '../../src/modules/wikipedia/wikipedia.service';
import {
  createClient,
  connectClient,
  waitForEvent,
  disconnectAll,
  TestSocket,
} from '../helpers/socket-client.helper';
import { createRoom, joinRoom } from '../helpers/room.helper';

const FRANCE_HTML = '<a href="/wiki/Paris">Paris</a><a href="/wiki/Tour_Eiffel">Tour Eiffel</a>';
const PARIS_HTML = '<a href="/wiki/Tour_Eiffel">Tour Eiffel</a><a href="/wiki/France">France</a>';
const TARGET_HTML = '<a href="/wiki/France">France</a>';

const mockWikipediaService = {
  selectStartAndTarget: jest.fn().mockReturnValue({ start: 'France', target: 'Tour_Eiffel' }),
  fetchPage: jest.fn(),
  isValidNavigation: jest.fn().mockResolvedValue(true),
};

async function setupApp() {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(WikipediaService)
    .useValue(mockWikipediaService)
    .compile();

  const app = module.createNestApplication();
  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(0);
  const addr = app.getHttpServer().address();
  const port = typeof addr === 'object' && addr !== null ? addr.port : 3001;
  return { app, port };
}

async function setupGame(port: number): Promise<{
  host: TestSocket;
  guest: TestSocket;
  code: string;
}> {
  const host = createClient(port);
  const guest = createClient(port);
  await connectClient(host);
  await connectClient(guest);

  const hostRoom = await createRoom(host, 'Alice');
  await joinRoom(guest, hostRoom.code, 'Bob');

  return { host, guest, code: hostRoom.code };
}

/**
 * Two-step game start:
 * 1. host emits game:start → server picks a random chooser (room:update)
 * 2. the chooser emits game:confirm_choices → game:state + game:page broadcast
 */
async function startFullGame(
  host: TestSocket,
  guest: TestSocket,
  code: string,
  hostPseudo: string,
): Promise<void> {
  const hostRoomUpdate = waitForEvent(host, 'wikirace:room:update');
  host.emit('wikirace:game:start', { roomCode: code });
  const updatedRoom = await hostRoomUpdate;

  const chooser = updatedRoom.chooserPseudo === hostPseudo ? host : guest;

  const allReady = Promise.all([
    waitForEvent(host, 'wikirace:game:state'),
    waitForEvent(guest, 'wikirace:game:state'),
    waitForEvent(host, 'wikirace:game:page'),
    waitForEvent(guest, 'wikirace:game:page'),
  ]);
  chooser.emit('wikirace:game:confirm_choices', { roomCode: code, timeLimitSeconds: null });
  await allReady;
}

describe('GameGateway — game flow (integration)', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    ({ app, port } = await setupApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockWikipediaService.selectStartAndTarget.mockReturnValue({
      start: 'France',
      target: 'Tour_Eiffel',
    });
    mockWikipediaService.fetchPage.mockImplementation(async (slug: string) => {
      const content: Record<string, string> = {
        France: FRANCE_HTML,
        Paris: PARIS_HTML,
        Tour_Eiffel: TARGET_HTML,
      };
      return { slug, title: slug, htmlContent: content[slug] ?? '<p>stub</p>' };
    });
    mockWikipediaService.isValidNavigation.mockResolvedValue(true);
  });

  it('game:start → picks a chooser and emits room:update with CHOOSING status', async () => {
    const { host, guest, code } = await setupGame(port);

    const hostUpdate = waitForEvent(host, 'wikirace:room:update');
    host.emit('wikirace:game:start', { roomCode: code });
    const room = await hostUpdate;

    expect(room.status).toBe('CHOOSING');
    expect(room.chooserPseudo).not.toBeNull();

    disconnectAll(host, guest);
  });

  it('game:confirm_choices → emits game:state and game:page to all players', async () => {
    const { host, guest, code } = await setupGame(port);

    const hostState = waitForEvent(host, 'wikirace:game:state');
    const guestState = waitForEvent(guest, 'wikirace:game:state');
    const hostPage = waitForEvent(host, 'wikirace:game:page');
    const guestPage = waitForEvent(guest, 'wikirace:game:page');

    await startFullGame(host, guest, code, 'Alice');

    const [state, , page] = await Promise.all([hostState, guestState, hostPage, guestPage]);
    expect(state.startSlug).toBe('France');
    expect(state.targetSlug).toBe('Tour_Eiffel');
    expect(state.playerStatuses).toHaveLength(2);
    expect(page.slug).toBe('France');

    disconnectAll(host, guest);
  });

  it('game:start by non-host → error emitted only to non-host', async () => {
    const { host, guest, code } = await setupGame(port);

    const errorPromise = waitForEvent(guest, 'error');
    guest.emit('wikirace:game:start', { roomCode: code });
    const err = await errorPromise;
    expect(err.message).toContain('NOT_HOST');

    disconnectAll(host, guest);
  });

  it('game:navigate valid → game:page to navigator, player:progress to room', async () => {
    const { host, guest, code } = await setupGame(port);
    await startFullGame(host, guest, code, 'Alice');

    const hostPage = waitForEvent(host, 'wikirace:game:page');
    const hostProgress = waitForEvent(host, 'wikirace:player:progress');
    const guestProgress = waitForEvent(guest, 'wikirace:player:progress');

    host.emit('wikirace:game:navigate', { roomCode: code, targetSlug: 'Paris' });

    const [page, progress] = await Promise.all([hostPage, hostProgress, guestProgress]);
    expect(page.slug).toBe('Paris');
    expect(progress.pseudo).toBe('Alice');
    expect(progress.hopCount).toBe(1);
    expect(progress.currentSlug).toBe('Paris');

    disconnectAll(host, guest);
  });

  it('game:navigate invalid → navigation:error to navigator only', async () => {
    mockWikipediaService.isValidNavigation.mockResolvedValue(false);
    const { host, guest, code } = await setupGame(port);
    await startFullGame(host, guest, code, 'Alice');

    const errorPromise = waitForEvent(host, 'error');
    host.emit('wikirace:game:navigate', { roomCode: code, targetSlug: 'Allemagne' });
    const err = await errorPromise;
    expect(err.message).toContain('INVALID_NAVIGATION');

    disconnectAll(host, guest);
  });

  it('game:navigate to target → game:finished emitted to room', async () => {
    const { host, guest, code } = await setupGame(port);
    await startFullGame(host, guest, code, 'Alice');

    const hostFinished = waitForEvent(host, 'wikirace:game:finished');
    const guestFinished = waitForEvent(guest, 'wikirace:game:finished');

    host.emit('wikirace:game:navigate', { roomCode: code, targetSlug: 'Tour_Eiffel' });

    const [summary] = await Promise.all([hostFinished, guestFinished]);
    expect(summary.winnerPseudo).toBe('Alice');
    expect(summary.targetSlug).toBe('Tour_Eiffel');

    disconnectAll(host, guest);
  });

  it('game:surrender by one player → player:progress with SURRENDERED', async () => {
    const { host, guest, code } = await setupGame(port);
    await startFullGame(host, guest, code, 'Alice');

    const hostProgress = waitForEvent(host, 'wikirace:player:progress');
    const guestProgress = waitForEvent(guest, 'wikirace:player:progress');

    guest.emit('wikirace:game:surrender', { roomCode: code });

    const [progress] = await Promise.all([hostProgress, guestProgress]);
    expect(progress.pseudo).toBe('Bob');
    expect(progress.status).toBe('SURRENDERED');

    disconnectAll(host, guest);
  });

  it('all players surrender → game:finished with no winner', async () => {
    const { host, guest, code } = await setupGame(port);
    await startFullGame(host, guest, code, 'Alice');

    const p1 = waitForEvent(host, 'wikirace:player:progress');
    const p2 = waitForEvent(guest, 'wikirace:player:progress');
    host.emit('wikirace:game:surrender', { roomCode: code });
    await Promise.all([p1, p2]);

    const hostFinished = waitForEvent(host, 'wikirace:game:finished');
    const guestFinished = waitForEvent(guest, 'wikirace:game:finished');
    guest.emit('wikirace:game:surrender', { roomCode: code });

    const [summary] = await Promise.all([hostFinished, guestFinished]);
    expect(summary.winnerPseudo).toBeNull();

    disconnectAll(host, guest);
  });
});
