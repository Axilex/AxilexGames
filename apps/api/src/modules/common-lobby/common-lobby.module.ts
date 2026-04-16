import { Module } from '@nestjs/common';
import { CommonLobbyService } from './common-lobby.service';
import { CommonLobbyRegistryService } from './common-lobby-registry.service';
import { CommonLobbyGateway } from './common-lobby.gateway';
import { SurenchereModule } from '../surenchere/surenchere.module';
import { LobbyModule } from '../lobby/lobby.module';
import { SnapAvisModule } from '../snap-avis/snap-avis.module';
import { TelepathieModule } from '../telepathie/telepathie.module';

@Module({
  imports: [SurenchereModule, LobbyModule, SnapAvisModule, TelepathieModule],
  providers: [CommonLobbyService, CommonLobbyRegistryService, CommonLobbyGateway],
})
export class CommonLobbyModule {}
