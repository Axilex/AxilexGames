import { TestSocket, waitForEvent } from './socket-client.helper';
import type { RoomDTO } from '@wiki-race/shared';

export async function createRoom(socket: TestSocket, pseudo: string): Promise<RoomDTO> {
  const roomUpdate = waitForEvent(socket, 'room:update');
  socket.emit('room:create', { pseudo });
  return roomUpdate;
}

export async function joinRoom(
  socket: TestSocket,
  roomCode: string,
  pseudo: string,
): Promise<RoomDTO> {
  const roomUpdate = waitForEvent(socket, 'room:update');
  socket.emit('room:join', { roomCode, pseudo });
  return roomUpdate;
}
