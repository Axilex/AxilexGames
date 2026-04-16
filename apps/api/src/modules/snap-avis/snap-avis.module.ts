import { Module } from '@nestjs/common';
import { SnapAvisService } from './snap-avis.service';
import { SnapAvisRegistryService } from './snap-avis-registry.service';
import { SnapAvisGateway } from './snap-avis.gateway';
import { RoomTimerService } from '../../common/game-room';

@Module({
  providers: [SnapAvisService, SnapAvisRegistryService, RoomTimerService, SnapAvisGateway],
  exports: [SnapAvisService, SnapAvisRegistryService],
})
export class SnapAvisModule {}
