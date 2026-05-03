import { TestSocket, waitForEvent } from './socket-client.helper';
import type { RoomDTO } from '@wiki-race/shared';

export async function createRoom(
  socket: TestSocket,
  pseudo: string,
): Promise<RoomDTO & { sessionToken: string }> {
  const roomUpdate = waitForEvent(socket, 'wikirace:room:update');
  const session = waitForEvent(socket, 'wikirace:session');
  socket.emit('wikirace:room:create', { pseudo });
  const [room, { token }] = await Promise.all([roomUpdate, session]);
  return { ...room, sessionToken: token };
}

export async function joinRoom(
  socket: TestSocket,
  roomCode: string,
  pseudo: string,
  sessionToken?: string,
): Promise<RoomDTO & { sessionToken: string }> {
  const roomUpdate = waitForEvent(socket, 'wikirace:room:update');
  const session = waitForEvent(socket, 'wikirace:session');
  socket.emit('wikirace:room:join', { roomCode, pseudo, sessionToken });
  const [room, { token }] = await Promise.all([roomUpdate, session]);
  return { ...room, sessionToken: token };
}
