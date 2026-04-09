import { Module } from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { RoomRegistryService } from './room-registry.service';

@Module({
  providers: [LobbyService, RoomRegistryService],
  exports: [LobbyService, RoomRegistryService],
})
export class LobbyModule {}
