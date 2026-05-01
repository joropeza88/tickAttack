import { GAME_CONFIG } from '@/core/config'
import type { GameStatus, LevelPhase } from '@/models/game'

interface TickResult {
  startedLastWave: boolean
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
      return { startedLastWave: false, advancedLevel: false }
    }

    this.hitFlash = Math.max(0, this.hitFlash - deltaMs)
    this.lastWaveBannerTimeLeftMs = Math.max(0, this.lastWaveBannerTimeLeftMs - deltaMs)

    if (this.levelPhase === 'transition') {
      this.levelTransitionTimeLeftMs = Math.max(0, this.levelTransitionTimeLeftMs - deltaMs)

      if (this.levelTransitionTimeLeftMs <= 0) {
        this.advanceLevel()
        return { startedLastWave: false, advancedLevel: true }
      }

      return { startedLastWave: false, advancedLevel: false }
    }

    this.levelTimeRemainingMs = Math.max(0, this.levelTimeRemainingMs - deltaMs)

    if (this.levelPhase === 'playing' && this.levelTimeRemainingMs <= GAME_CONFIG.progression.lastWaveTriggerMs) {
      this.levelPhase = 'last-wave'
      this.lastWaveBannerTimeLeftMs = GAME_CONFIG.progression.lastWaveBannerDurationMs
      return { startedLastWave: true, advancedLevel: false }
    }

    if (this.levelPhase === 'last-wave' && this.levelTimeRemainingMs <= 0) {
      this.levelPhase = 'cleanup'
    }

    return { startedLastWave: false, advancedLevel: false }
  }

  getLevel(): number {
    return this.level
  }

  getLevelProgress(): number {
    const duration = GAME_CONFIG.progression.levelDurationMs
    return duration <= 0 ? 1 : 1 - this.levelTimeRemainingMs / duration
  }

  getMaxEnemies(): number {
    const completedLevels = this.level - 1
    const extraEnemies = Math.floor(completedLevels / GAME_CONFIG.progression.extraEnemyEveryLevels)

    const baseMax = Math.min(
      GAME_CONFIG.progression.baseMaxEnemies + extraEnemies,
      GAME_CONFIG.progression.maxEnemiesCap
    )

    if (this.levelPhase === 'last-wave') {
      return baseMax + GAME_CONFIG.progression.lastWaveExtraEnemies
    }

    return baseMax
  }

  getSpawnIntervalMs(): number {
    if (this.levelPhase === 'last-wave') {
      return GAME_CONFIG.progression.lastWaveSpawnIntervalMs
    }

    return GAME_CONFIG.spawnIntervalMs
  }

  getSpawnChanceMultiplier(): number {
    if (this.levelPhase === 'last-wave') {
      return GAME_CONFIG.progression.lastWaveChanceMultiplier
    }

    return 1
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
  }
}
