import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameStateService } from './game-state.service';
import { ModeService } from './mode.service';
import { LobbyModule } from '../lobby/lobby.module';
import { WikipediaModule } from '../wikipedia/wikipedia.module';

@Module({
  imports: [LobbyModule, WikipediaModule],
  providers: [GameService, GameStateService, ModeService],
  exports: [GameService, GameStateService, ModeService],
})
export class GameModule {}
