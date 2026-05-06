import { Module } from '@nestjs/common';
import { BugMatrixService } from './bug-matrix.service';
import { BugMatrixRegistryService } from './bug-matrix-registry.service';
import { BugMatrixRulesService } from './bug-matrix-rules.service';
import { BugMatrixGateway } from './bug-matrix.gateway';
import { RoomTimerService } from '../../common/game-room';

@Module({
  providers: [
    BugMatrixService,
    BugMatrixRegistryService,
    BugMatrixRulesService,
    RoomTimerService,
    BugMatrixGateway,
  ],
  exports: [BugMatrixService, BugMatrixRegistryService],
})
export class BugMatrixModule {}
