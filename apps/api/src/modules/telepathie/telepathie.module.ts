import { Module } from '@nestjs/common';
import { TelepathieService } from './telepathie.service';
import { TelepathieRegistryService } from './telepathie-registry.service';
import { TelepathieGateway } from './telepathie.gateway';
import { RoomTimerService } from '../../common/game-room';

@Module({
  providers: [TelepathieService, TelepathieRegistryService, RoomTimerService, TelepathieGateway],
  exports: [TelepathieService, TelepathieRegistryService],
})
export class TelepathieModule {}
