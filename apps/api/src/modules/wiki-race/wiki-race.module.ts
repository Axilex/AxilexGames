import { Module } from '@nestjs/common';
import { LobbyModule } from '../lobby/lobby.module';
import { GameModule } from '../game/game.module';
import { WikiRaceGateway } from './wiki-race.gateway';

@Module({
  imports: [LobbyModule, GameModule],
  providers: [WikiRaceGateway],
})
export class WikiRaceModule {}
