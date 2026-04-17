import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { ModeService } from './mode.service';
import { LobbyModule } from '../lobby/lobby.module';
import { WikipediaModule } from '../wikipedia/wikipedia.module';
import { RoomTimerService } from '../../common/game-room';

@Module({
  imports: [LobbyModule, WikipediaModule],
  providers: [GameService, ModeService, RoomTimerService],
  exports: [GameService, ModeService, RoomTimerService],
})
export class GameModule {}
