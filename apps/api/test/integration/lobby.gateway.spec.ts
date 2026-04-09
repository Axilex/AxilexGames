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
    htmlContent: '<a href="/wiki/Tour_Eiffel">Tour Eiffel</a><a href="/wiki/Paris">Paris</a>',
  }),
  isValidNavigation: jest.fn().mockResolvedValue(true),
};

describe('LobbyGateway (integration)', () => {
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

  it('room:create → emits room:update to creator with correct room', async () => {
    const client = createClient(port);
    await connectClient(client);

    const room = await createRoom(client, 'Alice');
    expect(room.code).toHaveLength(6);
    expect(room.hostPseudo).toBe('Alice');
    expect(room.players).toHaveLength(1);
    expect(room.players[0].isHost).toBe(true);

    disconnectAll(client);
  });

  it('room:join → both clients receive room:update with 2 players', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await connectClient(host);
    await connectClient(guest);

    const hostRoom = await createRoom(host, 'Alice');
    const code = hostRoom.code;

    // Both should receive room:update when Bob joins
    const hostUpdate = waitForEvent(host, 'room:update');
    const guestUpdate = waitForEvent(guest, 'room:update');
    guest.emit('room:join', { roomCode: code, pseudo: 'Bob' });

    const [h, g] = await Promise.all([hostUpdate, guestUpdate]);
    expect(h.players).toHaveLength(2);
    expect(g.players).toHaveLength(2);

    disconnectAll(host, guest);
  });

  it('room:join with duplicate pseudo → error emitted to joiner', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await connectClient(host);
    await connectClient(guest);

    const hostRoom = await createRoom(host, 'Alice');

    const errorPromise = waitForEvent(guest, 'error');
    guest.emit('room:join', { roomCode: hostRoom.code, pseudo: 'Alice' });
    const err = await errorPromise;
    expect(err).toContain('PSEUDO_TAKEN');

    disconnectAll(host, guest);
  });

  it('room:join with invalid code → error emitted', async () => {
    const client = createClient(port);
    await connectClient(client);

    const errorPromise = waitForEvent(client, 'error');
    client.emit('room:join', { roomCode: 'XXXXXX', pseudo: 'Bob' });
    const err = await errorPromise;
    expect(err).toContain('ROOM_NOT_FOUND');

    disconnectAll(client);
  });

  it('room:leave by guest → host stays, player count decreases', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await connectClient(host);
    await connectClient(guest);

    const hostRoom = await createRoom(host, 'Alice');
    await joinRoom(guest, hostRoom.code, 'Bob');

    const updatePromise = waitForEvent(host, 'room:update');
    guest.emit('room:leave', { roomCode: hostRoom.code });
    const updated = await updatePromise;

    expect(updated.players).toHaveLength(1);
    expect(updated.hostPseudo).toBe('Alice');

    disconnectAll(host, guest);
  });

  it('room:leave by host → new host is promoted', async () => {
    const host = createClient(port);
    const guest = createClient(port);
    await connectClient(host);
    await connectClient(guest);

    const hostRoom = await createRoom(host, 'Alice');
    await joinRoom(guest, hostRoom.code, 'Bob');

    const updatePromise = waitForEvent(guest, 'room:update');
    host.emit('room:leave', { roomCode: hostRoom.code });
    const updated = await updatePromise;

    expect(updated.players).toHaveLength(1);
    expect(updated.hostPseudo).toBe('Bob');
    expect(updated.players[0].isHost).toBe(true);

    disconnectAll(host, guest);
  });
});
