export enum GameStatus {
  WAITING = 'WAITING',
  CHOOSING = 'CHOOSING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export enum PlayerStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  SURRENDERED = 'SURRENDERED',
  FINISHED = 'FINISHED',
}

export enum GameMode {
  CLASSIC = 'CLASSIC',
  SPRINT = 'SPRINT',
  LABYRINTH = 'LABYRINTH',
  DRIFT = 'DRIFT',
  BINGO = 'BINGO',
}

export enum DriftObjective {
  OLDEST_TITLE_YEAR = 'oldest_title_year',
  SHORTEST = 'shortest',
  MOST_IMAGES = 'most_images',
}
