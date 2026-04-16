import { Module } from '@nestjs/common';
import { SnapAvisService } from './snap-avis.service';
import { SnapAvisRegistryService } from './snap-avis-registry.service';
import { SnapAvisTimerService } from './snap-avis-timer.service';
import { SnapAvisGateway } from './snap-avis.gateway';

@Module({
  providers: [SnapAvisService, SnapAvisRegistryService, SnapAvisTimerService, SnapAvisGateway],
  exports: [SnapAvisService, SnapAvisRegistryService],
})
export class SnapAvisModule {}
