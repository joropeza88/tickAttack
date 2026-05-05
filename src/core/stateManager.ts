import { GAME_CONFIG } from '@/core/config'
import type { GameStatus, LevelPhase } from '@/models/game'

interface TickResult {
  startedLastWave: boolean
  startedRegularWave: boolean
  advancedLevel: boolean
}

export class StateManager {
  score = 0
  lives = GAME_CONFIG.initialLives
  level = 1
  abilityUsesRemaining = GAME_CONFIG.ability.usesPerLevel
  levelPhase: LevelPhase = 'playing'
  status: GameStatus = 'idle'
  hitFlash = 0
  levelTimeRemainingMs: number = GAME_CONFIG.progression.levelDurationMs
  lastWaveBannerTimeLeftMs: number = 0
  levelTransitionTimeLeftMs: number = 0
  waveStartCue = 0
  private levelElapsedMs = 0
  private nextRegularWaveStartMs = 0
  private lastWaveStarted = false

  reset(): void {
    this.score = 0
    this.lives = GAME_CONFIG.initialLives
    this.level = 1
    this.abilityUsesRemaining = GAME_CONFIG.ability.usesPerLevel
    this.levelPhase = 'playing'
    this.status = 'idle'
    this.hitFlash = 0
    this.levelTimeRemainingMs = GAME_CONFIG.progression.levelDurationMs
    this.lastWaveBannerTimeLeftMs = 0
    this.levelTransitionTimeLeftMs = 0
    this.waveStartCue = 0
    this.levelElapsedMs = 0
    this.nextRegularWaveStartMs = 0
    this.lastWaveStarted = false
  }

  start(): void {
    this.status = 'running'
  }

  addScore(value = 1): void {
    this.score += value
  }

  canUseAbility(): boolean {
    return this.status === 'running' && this.levelPhase !== 'transition' && this.abilityUsesRemaining > 0
  }

  consumeAbilityUse(): boolean {
    if (!this.canUseAbility()) {
      return false
    }

    this.abilityUsesRemaining -= 1
    return true
  }

  applyHit(): void {
    if (this.levelPhase === 'transition') {
      return
    }

    this.lives -= 1
    this.hitFlash = 220
    if (this.lives <= 0) {
      this.status = 'game-over'
    }
  }

  tick(deltaMs: number): TickResult {
    if (this.status !== 'running') {
      return { startedLastWave: false, startedRegularWave: false, advancedLevel: false }
    }

    this.hitFlash = Math.max(0, this.hitFlash - deltaMs)
    this.lastWaveBannerTimeLeftMs = Math.max(0, this.lastWaveBannerTimeLeftMs - deltaMs)

    if (this.levelPhase === 'transition') {
      this.levelTransitionTimeLeftMs = Math.max(0, this.levelTransitionTimeLeftMs - deltaMs)

      if (this.levelTransitionTimeLeftMs <= 0) {
        this.advanceLevel()
        return { startedLastWave: false, startedRegularWave: false, advancedLevel: true }
      }

      return { startedLastWave: false, startedRegularWave: false, advancedLevel: false }
    }

    const levelDurationMs = GAME_CONFIG.progression.levelDurationMs
    const lastWaveStartMs = levelDurationMs - GAME_CONFIG.progression.lastWaveDurationMs
    this.levelElapsedMs = Math.min(levelDurationMs, this.levelElapsedMs + deltaMs)
    this.levelTimeRemainingMs = Math.max(0, levelDurationMs - this.levelElapsedMs)

    let startedRegularWave = false

    while (
      this.nextRegularWaveStartMs < lastWaveStartMs &&
      this.levelElapsedMs >= this.nextRegularWaveStartMs
    ) {
      this.waveStartCue += 1
      startedRegularWave = true
      this.nextRegularWaveStartMs += GAME_CONFIG.progression.waveIntervalMs
    }

    if (!this.lastWaveStarted && this.levelElapsedMs >= lastWaveStartMs) {
      this.lastWaveStarted = true
      this.levelPhase = 'last-wave'
      this.lastWaveBannerTimeLeftMs = GAME_CONFIG.progression.lastWaveBannerDurationMs
      this.waveStartCue += 1
      return { startedLastWave: true, startedRegularWave, advancedLevel: false }
    }

    if (this.levelElapsedMs >= levelDurationMs) {
      this.levelPhase = 'cleanup'
    }

    return { startedLastWave: false, startedRegularWave, advancedLevel: false }
  }

  getLevel(): number {
    return this.level
  }

  getLevelProgress(): number {
    const duration = GAME_CONFIG.progression.levelDurationMs
    return duration <= 0 ? 1 : 1 - this.levelTimeRemainingMs / duration
  }

  getWaveEnemyCount(isLastWave: boolean): number {
    const completedLevels = this.level - 1
    const normalWaveCount = Math.min(
      GAME_CONFIG.progression.baseEnemiesPerWave +
        Math.floor(completedLevels / GAME_CONFIG.progression.extraWaveEnemyEveryLevels),
      GAME_CONFIG.progression.maxEnemiesPerWave
    )

    if (!isLastWave) {
      return normalWaveCount
    }

    return Math.min(
      normalWaveCount +
        GAME_CONFIG.progression.lastWaveBaseExtraEnemies +
        Math.floor(completedLevels / GAME_CONFIG.progression.lastWaveExtraEnemyEveryLevels),
      GAME_CONFIG.progression.maxEnemiesPerLastWave
    )
  }

  getWaveChanceMultiplier(isLastWave: boolean): number {
    return isLastWave ? GAME_CONFIG.progression.lastWaveChanceMultiplier : 1
  }

  shouldSpawnEnemies(): boolean {
    return this.levelPhase === 'playing' || this.levelPhase === 'last-wave'
  }

  isLastWave(): boolean {
    return this.levelPhase === 'last-wave'
  }

  getUpcomingLevel(): number {
    return this.level + 1
  }

  hasCompletedVictoryLevel(): boolean {
    return this.level >= GAME_CONFIG.progression.victoryLevel
  }

  win(): void {
    this.status = 'victory'
    this.levelPhase = 'cleanup'
    this.lastWaveBannerTimeLeftMs = 0
    this.levelTransitionTimeLeftMs = 0
  }

  beginLevelTransition(): void {
    if (this.levelPhase === 'transition') {
      return
    }

    this.levelPhase = 'transition'
    this.levelTransitionTimeLeftMs = GAME_CONFIG.progression.levelTransitionDurationMs
  }

  private advanceLevel(): void {
    this.level += 1
    this.levelPhase = 'playing'
    this.lives = GAME_CONFIG.initialLives
    this.abilityUsesRemaining = GAME_CONFIG.ability.usesPerLevel
    this.levelTimeRemainingMs = GAME_CONFIG.progression.levelDurationMs
    this.lastWaveBannerTimeLeftMs = 0
    this.levelTransitionTimeLeftMs = 0
    this.levelElapsedMs = 0
    this.nextRegularWaveStartMs = 0
    this.lastWaveStarted = false
  }
}
