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
} from '../helpers/socket-client.helper';
import { createRoom, joinRoom } from '../helpers/room.helper';

const mockWikipediaService = {
  selectStartAndTarget: jest.fn().mockReturnValue({ start: 'France', target: 'Tour_Eiffel' }),
  fetchPage: jest.fn().mockResolvedValue({
    slug: 'France',
    title: 'France',
    htmlContent: '<a href="/wiki/Paris">Paris</a><a href="/wiki/Tour_Eiffel">Tour Eiffel</a>',
  }),
  isValidNavigation: jest.fn().mockResolvedValue(true),
};

describe('Reconnection flow (integration)', () => {
  let app: INestApplication;
  let port: number;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(WikipediaService)
      .useValue(mockWikipediaService)
      .compile();

    app = module.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);
    const addr = app.getHttpServer().address();
    port = typeof addr === 'object' && addr !== null ? addr.port : 3001;
  });

  afterAll(async () => {
    await app.close();
  });

  it('disconnect → player:disconnected emitted to room, player kept in room', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await connectClient(host);
    await connectClient(guest);

    const hostRoom = await createRoom(host, 'Alice');
    await joinRoom(guest, hostRoom.code, 'Bob');

    const disconnectedPromise = waitForEvent(host, 'player:disconnected');
    guest.disconnect();

    const pseudo = await disconnectedPromise;
    expect(pseudo).toBe('Bob');

    disconnectAll(host);
  });

  it('reconnect within timeout → player:reconnected emitted, room:update reflects status', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await connectClient(host);
    await connectClient(guest);

    const hostRoom = await createRoom(host, 'Alice');
    await joinRoom(guest, hostRoom.code, 'Bob');

    // Disconnect Bob
    const disconnectedPromise = waitForEvent(host, 'player:disconnected');
    guest.disconnect();
    await disconnectedPromise;

    // Bob reconnects with a new socket
    const reconnectedGuest = createClient(port);
    await connectClient(reconnectedGuest);

    const reconnectedPromise = waitForEvent(host, 'player:reconnected');
    const roomUpdatePromise = waitForEvent(host, 'room:update');

    reconnectedGuest.emit('room:join', { roomCode: hostRoom.code, pseudo: 'Bob' });

    const [pseudo, updatedRoom] = await Promise.all([reconnectedPromise, roomUpdatePromise]);
    expect(pseudo).toBe('Bob');
    expect(updatedRoom.players).toHaveLength(2);
    const bob = updatedRoom.players.find((p) => p.pseudo === 'Bob');
    expect(bob?.status).toBe('CONNECTED');

    disconnectAll(host, reconnectedGuest);
  });

  it('reconnect during game → game:state re-sent to reconnecting player', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await connectClient(host);
    await connectClient(guest);

    const hostRoom = await createRoom(host, 'Alice');
    await joinRoom(guest, hostRoom.code, 'Bob');

    // Start game (two-step: host picks chooser, then chooser confirms)
    const hostRoomUpdate = waitForEvent(host, 'room:update');
    host.emit('game:start', { roomCode: hostRoom.code });
    const updatedRoom = await hostRoomUpdate;
    const chooser = updatedRoom.chooserPseudo === 'Alice' ? host : guest;

    const allReady = Promise.all([
      waitForEvent(host, 'game:state'),
      waitForEvent(guest, 'game:state'),
      waitForEvent(host, 'game:page'),
      waitForEvent(guest, 'game:page'),
    ]);
    chooser.emit('game:confirm_choices', { roomCode: hostRoom.code, timeLimitSeconds: null });
    await allReady;

    // Bob disconnects mid-game
    const disconnectedPromise = waitForEvent(host, 'player:disconnected');
    guest.disconnect();
    await disconnectedPromise;

    // Bob reconnects
    const reconnectedGuest = createClient(port);
    await connectClient(reconnectedGuest);

    const gameStatePromise = waitForEvent(reconnectedGuest, 'game:state');
    reconnectedGuest.emit('room:join', { roomCode: hostRoom.code, pseudo: 'Bob' });

    const state = await gameStatePromise;
    expect(state.startSlug).toBe('France');
    expect(state.targetSlug).toBe('Tour_Eiffel');

    disconnectAll(host, reconnectedGuest);
  });
});
