import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameStateService } from './game-state.service';
import { LobbyModule } from '../lobby/lobby.module';
import { WikipediaModule } from '../wikipedia/wikipedia.module';

@Module({
  imports: [LobbyModule, WikipediaModule],
  providers: [GameService, GameStateService],
  exports: [GameService, GameStateService],
})
export class GameModule {}
