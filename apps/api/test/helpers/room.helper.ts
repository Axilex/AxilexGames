import { TestSocket, waitForEvent } from './socket-client.helper';
import type { RoomDTO } from '@wiki-race/shared';

export async function createRoom(socket: TestSocket, pseudo: string): Promise<RoomDTO> {
  const roomUpdate = waitForEvent(socket, 'wikirace:room:update');
  socket.emit('wikirace:room:create', { pseudo });
  return roomUpdate;
}

export async function joinRoom(
  socket: TestSocket,
  roomCode: string,
  pseudo: string,
): Promise<RoomDTO> {
  const roomUpdate = waitForEvent(socket, 'wikirace:room:update');
  socket.emit('wikirace:room:join', { roomCode, pseudo });
  return roomUpdate;
}
