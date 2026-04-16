// Domain types (internal models)
export * from './domain/enums';
export * from './domain/room.types';
export * from './domain/wikipedia.types';
export * from './domain/game-summary.types';
export * from './domain/bingo.types';
export * from './domain/surenchere.types';
export * from './domain/common-lobby.types';
export * from './domain/snap-avis.types';

// DTOs (wire format)
export * from './dto/player.dto';
export * from './dto/room.dto';
export * from './dto/player-progress.dto';
export * from './dto/game-state.dto';

// Socket.IO event contracts
export * from './events/client-to-server.events';
export * from './events/server-to-client.events';
