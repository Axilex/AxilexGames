import { Module } from '@nestjs/common';
import { LobbyModule } from './modules/lobby/lobby.module';
import { GameModule } from './modules/game/game.module';
import { WikipediaModule } from './modules/wikipedia/wikipedia.module';
import { GameGateway } from './gateways/game.gateway';
import { HealthController } from './health.controller';

@Module({
  imports: [LobbyModule, GameModule, WikipediaModule],
  controllers: [HealthController],
  providers: [GameGateway],
})
export class AppModule {}
