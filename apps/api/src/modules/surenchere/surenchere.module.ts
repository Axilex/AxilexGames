import { Module } from '@nestjs/common';
import { SurenchereService } from './surenchere.service';
import { SurenchereRegistryService } from './surenchere-registry.service';
import { SurenchereGateway } from './surenchere.gateway';
import { RoomTimerService } from '../../common/game-room';

@Module({
  providers: [SurenchereService, SurenchereRegistryService, RoomTimerService, SurenchereGateway],
  exports: [SurenchereService, SurenchereRegistryService],
})
export class SurenchereModule {}
