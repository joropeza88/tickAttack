import { GAME_CONFIG } from '@/core/config'
import { EnemyManager } from '@/core/enemyManager'
import { PlayerController } from '@/core/playerController'
import { StateManager } from '@/core/stateManager'
import type { GameSnapshot, GasCloudEntity, PlayerEntity, TapResolution, ViewportBounds } from '@/models/game'

interface EngineOptions {
  onFrame: (snapshot: GameSnapshot) => void
}

export class GameEngine {
  private readonly state = new StateManager()
  private readonly enemyManager = new EnemyManager()
  private readonly playerController = new PlayerController()
  private readonly onFrame: EngineOptions['onFrame']

  private viewport: ViewportBounds = { ...GAME_CONFIG.viewport }
  private player: PlayerEntity = this.playerController.createPlayer(this.viewport)
  private gasCloud: GasCloudEntity = {
    active: false,
    position: { x: 0, y: 0 },
    radius: GAME_CONFIG.ability.gasCloudRadius,
    timeLeftMs: 0
  }
  private frameId = 0
  private lastFrame = 0
  private startLevel = 1

  constructor({ onFrame }: EngineOptions) {
    this.onFrame = onFrame
    this.emit()
  }

  setViewport(width: number, height: number): void {
    this.viewport = { width, height }
    this.player = this.playerController.createPlayer(this.viewport)
    this.emit()
  }

  start(level = 1): void {
    this.startLevel = Math.min(
      GAME_CONFIG.progression.victoryLevel,
      Math.max(1, Math.floor(level))
    )
    this.state.reset(this.startLevel)
    this.state.start()
    this.enemyManager.reset()
    this.player = this.playerController.createPlayer(this.viewport)
    this.gasCloud = {
      active: false,
      position: { x: 0, y: 0 },
      radius: GAME_CONFIG.ability.gasCloudRadius,
      timeLeftMs: 0
    }
    this.lastFrame = performance.now()
    cancelAnimationFrame(this.frameId)
    this.frameId = requestAnimationFrame(this.loop)
    this.emit()
  }

  stop(): void {
    cancelAnimationFrame(this.frameId)
  }

  restart(): void {
    this.start(this.startLevel)
  }

  continueToNextLevel(): void {
    this.state.startNextLevel()
    this.emit()
  }

  tap(localX: number, localY: number): TapResolution {
    if (this.state.status !== 'running') {
      return { hit: false, killed: false, scoreGained: 0 }
    }

    const resolution = this.enemyManager.destroyAtPoint(localX, localY, this.viewport)

    if (resolution.scoreGained > 0) {
      this.state.addScore(resolution.scoreGained)
    }

    if (resolution.hit) {
      this.emit()
    }

    return resolution
  }

  deployGasCloud(localX: number, localY: number): boolean {
    if (!this.state.consumeAbilityUse()) {
      return false
    }

    this.gasCloud.active = true
    this.gasCloud.position = { x: localX, y: localY }
    this.gasCloud.radius = GAME_CONFIG.ability.gasCloudRadius
    this.gasCloud.timeLeftMs = GAME_CONFIG.ability.gasCloudDurationMs

    const scoreGained = this.enemyManager.applyGasCloud(this.gasCloud, this.viewport)
    if (scoreGained > 0) {
      this.state.addScore(scoreGained)
    }

    this.emit()
    return true
  }

  private loop = (timestamp: number): void => {
    const deltaMs = Math.min(timestamp - this.lastFrame, 32)
    this.lastFrame = timestamp

    const tickResult = this.state.tick(deltaMs)
    this.playerController.updatePlayer(this.player, this.viewport)

    for (let index = 0; index < tickResult.regularWavesStarted; index += 1) {
      this.enemyManager.spawnWave(
        this.state.getWaveEnemyCount(false),
        this.state.getLevel(),
        this.viewport,
        this.state.getWaveChanceMultiplier(false)
      )
    }

    for (let index = 0; index < tickResult.lastWavesStarted; index += 1) {
      this.enemyManager.spawnWave(
        this.state.getWaveEnemyCount(true),
        this.state.getLevel(),
        this.viewport,
        this.state.getWaveChanceMultiplier(true)
      )
    }

    this.enemyManager.update(deltaMs, this.viewport)

    this.updateGasCloud(deltaMs)

    if (
      !this.state.shouldSpawnEnemies() &&
      this.enemyManager.getActiveEnemyCount() === 0 &&
      !this.enemyManager.hasFallingEnemies()
    ) {
      if (this.state.hasCompletedVictoryLevel()) {
        this.state.win()
      } else {
        this.state.markLevelComplete()
      }
    }

    this.handleCollisions()
    this.emit()

    if (this.state.status === 'running') {
      this.frameId = requestAnimationFrame(this.loop)
    }
  }

  private updateGasCloud(deltaMs: number): void {
    if (!this.gasCloud.active) {
      return
    }

    this.gasCloud.timeLeftMs = Math.max(0, this.gasCloud.timeLeftMs - deltaMs)
    const scoreGained = this.enemyManager.applyGasCloud(this.gasCloud, this.viewport)

    if (scoreGained > 0) {
      this.state.addScore(scoreGained)
    }

    if (this.gasCloud.timeLeftMs <= 0) {
      this.gasCloud.active = false
    }
  }

  private handleCollisions(): void {
    const collisions = this.enemyManager.removeColliding(this.player)

    for (let hit = 0; hit < collisions; hit += 1) {
      this.state.applyHit()
    }

    if (this.state.status === 'game-over') {
      cancelAnimationFrame(this.frameId)
    }
  }

  private emit(): void {
    this.onFrame({
      status: this.state.status,
      score: this.state.score,
      lives: this.state.lives,
      level: this.state.getLevel(),
      abilityUsesRemaining: this.state.abilityUsesRemaining,
      waveStartCue: this.state.waveStartCue,
      levelPhase: this.state.levelPhase,
      upcomingLevel: this.state.getUpcomingLevel(),
      isLastWave: this.state.isLastWave(),
      levelProgress: this.state.getLevelProgress(),
      levelTimeRemainingMs: this.state.levelTimeRemainingMs,
      lastWaveBannerTimeLeftMs: this.state.lastWaveBannerTimeLeftMs,
      player: this.player,
      gasCloud: {
        active: this.gasCloud.active,
        position: { ...this.gasCloud.position },
        radius: this.gasCloud.radius,
        timeLeftMs: this.gasCloud.timeLeftMs
      },
      enemies: this.enemyManager.getRenderableEnemies(),
      hitFlash: this.state.hitFlash,
      hitCount: this.state.hitCount
    })
  }
}
