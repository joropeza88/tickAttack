export type GameStatus = 'idle' | 'running' | 'game-over' | 'victory'
export type LevelPhase = 'playing' | 'last-wave' | 'cleanup' | 'transition'

export interface Vector2D {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface PlayerEntity {
  id: string
  position: Vector2D
  size: Size
}

export interface GasCloudEntity {
  active: boolean
  position: Vector2D
  radius: number
  timeLeftMs: number
}

export type EnemyType = 'scout' | 'worker' | 'mother'
export type EnemyState = 'falling' | 'crushed'

export interface EnemyBuffState {
  armor: boolean
  speedBoost: boolean
  swerve: boolean
}

export interface EnemyEntity {
  id: string
  position: Vector2D
  size: Size
  type: EnemyType
  baseSpeed: number
  currentSpeed: number
  tapsRequired: number
  tapsTaken: number
  scoreValue: number
  state: EnemyState
  stateTimeLeftMs: number
  tapFeedbackTimeLeftMs: number
  buffs: EnemyBuffState
  spawnDriftTimeLeftMs: number
  spawnDriftVelocityX: number
  swerveDelayMs: number
  swerveTimeLeftMs: number
  swerveVelocityX: number
}

export interface ViewportBounds {
  width: number
  height: number
}

export interface GameSnapshot {
  status: GameStatus
  score: number
  lives: number
  level: number
  abilityUsesRemaining: number
  levelPhase: LevelPhase
  upcomingLevel: number
  isLastWave: boolean
  levelProgress: number
  levelTimeRemainingMs: number
  lastWaveBannerTimeLeftMs: number
  levelTransitionTimeLeftMs: number
  player: PlayerEntity
  gasCloud: GasCloudEntity
  enemies: EnemyEntity[]
  hitFlash: number
}

export interface TapResolution {
  hit: boolean
  killed: boolean
  scoreGained: number
}
