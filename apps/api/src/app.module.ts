import { Module } from '@nestjs/common';
import { LobbyModule } from './modules/lobby/lobby.module';
import { GameModule } from './modules/game/game.module';
import { WikipediaModule } from './modules/wikipedia/wikipedia.module';
import { SurenchereModule } from './modules/surenchere/surenchere.module';
import { CommonLobbyModule } from './modules/common-lobby/common-lobby.module';
import { GameGateway } from './gateways/game.gateway';
import { HealthController } from './health.controller';

@Module({
  imports: [LobbyModule, GameModule, WikipediaModule, SurenchereModule, CommonLobbyModule],
  controllers: [HealthController],
  providers: [GameGateway],
})
export class AppModule {}
