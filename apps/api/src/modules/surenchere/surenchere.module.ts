import { Module } from '@nestjs/common';
import { SurenchereService } from './surenchere.service';
import { SurenchereRegistryService } from './surenchere-registry.service';
import { SurenchereGateway } from './surenchere.gateway';

@Module({
  providers: [SurenchereService, SurenchereRegistryService, SurenchereGateway],
  exports: [SurenchereService],
})
export class SurenchereModule {}
