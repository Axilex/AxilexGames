import { Module } from '@nestjs/common';
import { TelepathieService } from './telepathie.service';
import { TelepathieRegistryService } from './telepathie-registry.service';
import { TelepathieTimerService } from './telepathie-timer.service';
import { TelepathieGateway } from './telepathie.gateway';

@Module({
  providers: [
    TelepathieService,
    TelepathieRegistryService,
    TelepathieTimerService,
    TelepathieGateway,
  ],
  exports: [TelepathieService, TelepathieRegistryService],
})
export class TelepathieModule {}
