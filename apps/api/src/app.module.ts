import { Module } from '@nestjs/common';
import { LobbyModule } from './modules/lobby/lobby.module';
import { GameModule } from './modules/game/game.module';
import { WikipediaModule } from './modules/wikipedia/wikipedia.module';
import { SurenchereModule } from './modules/surenchere/surenchere.module';
import { SnapAvisModule } from './modules/snap-avis/snap-avis.module';
import { TelepathieModule } from './modules/telepathie/telepathie.module';
import { CommonLobbyModule } from './modules/common-lobby/common-lobby.module';
import { WikiRaceModule } from './modules/wiki-race/wiki-race.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    LobbyModule,
    GameModule,
    WikipediaModule,
    SurenchereModule,
    SnapAvisModule,
    TelepathieModule,
    CommonLobbyModule,
    WikiRaceModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
