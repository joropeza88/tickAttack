import { GAME_CONFIG } from '@/core/config'
import type { EnemyBuffState, EnemyEntity, EnemyType, GasCloudEntity, PlayerEntity, TapResolution, ViewportBounds } from '@/models/game'
import { clamp, randomBetween } from '@/utils/math'

let enemyId = 0

const createBuffState = (): EnemyBuffState => ({
  armor: false,
  speedBoost: false,
  swerve: false,
  leap: false
})

const getChanceForLevel = (base: number, perLevel: number, max: number, level: number): number =>
  Math.min(max, base + Math.max(0, level - 1) * perLevel)

export class EnemyManager {
  private enemies: EnemyEntity[] = []
  private pool: EnemyEntity[] = []
  private activeEnemyCount = 0

  reset(): void {
    this.pool.push(...this.enemies)
    this.enemies = []
    this.activeEnemyCount = 0
  }

  update(deltaMs: number, viewport: ViewportBounds): void {
    const deltaSeconds = deltaMs / 1000

    this.enemies = this.enemies.filter((enemy) => {
      enemy.tapFeedbackTimeLeftMs = Math.max(0, enemy.tapFeedbackTimeLeftMs - deltaMs)

      if (enemy.state === 'crushed') {
        enemy.stateTimeLeftMs = Math.max(0, enemy.stateTimeLeftMs - deltaMs)

        if (enemy.stateTimeLeftMs <= 0) {
          this.pool.push(enemy)
          return false
        }

        return true
      }

      enemy.position.y += enemy.currentSpeed * deltaSeconds
      this.updateLeap(enemy, deltaMs)
      this.updateSpawnDrift(enemy, deltaMs, viewport, deltaSeconds)
      this.updateSwerve(enemy, deltaMs, viewport, deltaSeconds)

      if (enemy.position.y > viewport.height + GAME_CONFIG.enemy.despawnOffset) {
        this.activeEnemyCount = Math.max(0, this.activeEnemyCount - 1)
        this.pool.push(enemy)
        return false
      }

      return true
    })
  }

  destroyAtPoint(x: number, y: number, viewport: ViewportBounds): TapResolution {
    const targetEnemy = this.findEnemyAtPoint(x, y)
    if (!targetEnemy) {
      return { hit: false, killed: false, scoreGained: 0 }
    }

    targetEnemy.tapsTaken += 1

    if (targetEnemy.tapsTaken >= targetEnemy.tapsRequired) {
      this.crushEnemy(targetEnemy, viewport)
      return { hit: true, killed: true, scoreGained: targetEnemy.scoreValue }
    }

    targetEnemy.tapFeedbackTimeLeftMs = GAME_CONFIG.enemy.hitFeedbackDurationMs

    if ((targetEnemy.type === 'worker' || targetEnemy.type === 'flea') && targetEnemy.buffs.armor) {
      targetEnemy.currentSpeed = targetEnemy.baseSpeed * GAME_CONFIG.enemy.buffs.armor.slowMultiplierOnHit
    }

    return { hit: true, killed: false, scoreGained: 0 }
  }

  removeColliding(player: PlayerEntity): number {
    let collisions = 0

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.state === 'crushed') {
        return true
      }

      const isCollision =
        player.position.x < enemy.position.x + enemy.size.width &&
        player.position.x + player.size.width > enemy.position.x &&
        player.position.y < enemy.position.y + enemy.size.height &&
        player.position.y + player.size.height > enemy.position.y

      if (isCollision) {
        collisions += 1
        this.activeEnemyCount = Math.max(0, this.activeEnemyCount - 1)
        this.pool.push(enemy)
        return false
      }

      return true
    })

    return collisions
  }

  applyGasCloud(cloud: GasCloudEntity, viewport: ViewportBounds): number {
    if (!cloud.active) {
      return 0
    }

    let scoreGained = 0
    const pendingCrush: EnemyEntity[] = []

    for (const enemy of this.enemies) {
      if (enemy.state !== 'falling') {
        continue
      }

      const enemyCenterX = enemy.position.x + enemy.size.width / 2
      const enemyCenterY = enemy.position.y + enemy.size.height / 2
      const distance = Math.hypot(enemyCenterX - cloud.position.x, enemyCenterY - cloud.position.y)
      const effectiveRadius = cloud.radius + Math.max(enemy.size.width, enemy.size.height) * 0.35

      if (distance <= effectiveRadius) {
        pendingCrush.push(enemy)
      }
    }

    for (const enemy of pendingCrush) {
      if (enemy.state !== 'falling') {
        continue
      }

      scoreGained += enemy.scoreValue
      this.crushEnemy(enemy, viewport)
    }

    return scoreGained
  }

  getActiveEnemyCount(): number {
    return this.activeEnemyCount
  }

  hasFallingEnemies(): boolean {
    return this.enemies.some((enemy) => enemy.state === 'falling')
  }

  getRenderableEnemies(): EnemyEntity[] {
    return this.enemies.map((enemy) => ({
      ...enemy
    }))
  }

  spawnWave(count: number, level: number, viewport: ViewportBounds, chanceMultiplier: number): void {
    for (let index = 0; index < count; index += 1) {
      this.spawn(level, viewport, chanceMultiplier)
    }
  }

  private updateSwerve(enemy: EnemyEntity, deltaMs: number, viewport: ViewportBounds, deltaSeconds: number): void {
    if (!enemy.buffs.swerve) {
      return
    }

    if (enemy.swerveDelayMs > 0) {
      enemy.swerveDelayMs = Math.max(0, enemy.swerveDelayMs - deltaMs)
      return
    }

    if (enemy.swerveTimeLeftMs <= 0) {
      return
    }

    enemy.swerveTimeLeftMs = Math.max(0, enemy.swerveTimeLeftMs - deltaMs)
    enemy.position.x += enemy.swerveVelocityX * deltaSeconds
    enemy.position.x = this.clampEnemyX(enemy.position.x, enemy.size.width, viewport.width)
  }

  private updateLeap(enemy: EnemyEntity, deltaMs: number): void {
    if (!enemy.buffs.leap) {
      return
    }

    if (enemy.leapDelayMs > 0) {
      enemy.leapDelayMs = Math.max(0, enemy.leapDelayMs - deltaMs)
      return
    }

    if (enemy.leapTimeLeftMs <= 0) {
      enemy.leapAppliedOffsetY = 0
      return
    }

    enemy.leapTimeLeftMs = Math.max(0, enemy.leapTimeLeftMs - deltaMs)
    const leapProgress =
      enemy.leapDurationMs <= 0
        ? 1
        : 1 - enemy.leapTimeLeftMs / enemy.leapDurationMs
    const easedProgress = 1 - Math.pow(1 - leapProgress, 3)
    const targetOffsetY = enemy.leapDistanceY * easedProgress
    const deltaOffsetY = targetOffsetY - enemy.leapAppliedOffsetY

    enemy.position.y += deltaOffsetY
    enemy.leapAppliedOffsetY = targetOffsetY

    if (enemy.leapTimeLeftMs <= 0) {
      enemy.leapAppliedOffsetY = 0
    }
  }

  private updateSpawnDrift(enemy: EnemyEntity, deltaMs: number, viewport: ViewportBounds, deltaSeconds: number): void {
    if (enemy.spawnDriftTimeLeftMs <= 0 || enemy.spawnDriftVelocityX === 0) {
      return
    }

    enemy.spawnDriftTimeLeftMs = Math.max(0, enemy.spawnDriftTimeLeftMs - deltaMs)
    enemy.position.x += enemy.spawnDriftVelocityX * deltaSeconds
    enemy.position.x = this.clampEnemyX(enemy.position.x, enemy.size.width, viewport.width)

    if (enemy.spawnDriftTimeLeftMs <= 0) {
      enemy.spawnDriftVelocityX = 0
    }
  }

  private spawn(level: number, viewport: ViewportBounds, chanceMultiplier: number): void {
    const type = this.chooseSpawnType(level, chanceMultiplier)
    const enemy = this.createEnemy(type, viewport)

    if (type === 'worker' || type === 'flea') {
      this.applyGroundEnemyBuffs(enemy, level, chanceMultiplier)
    }

    this.enemies.push(enemy)
    this.activeEnemyCount += 1
  }

  private chooseSpawnType(level: number, chanceMultiplier: number): EnemyType {
    const fleaConfig = GAME_CONFIG.enemy.flea
    if (level >= fleaConfig.minLevel) {
      const fleaChance = Math.min(
        1,
        getChanceForLevel(
          fleaConfig.spawnChanceBase,
          fleaConfig.spawnChancePerLevel,
          fleaConfig.spawnChanceMax,
          level
        ) * chanceMultiplier
      )

      if (Math.random() < fleaChance) {
        return 'flea'
      }
    }

    const motherConfig = GAME_CONFIG.enemy.mother
    if (level >= motherConfig.minLevel) {
      const motherChance = Math.min(
        1,
        getChanceForLevel(
        motherConfig.spawnChanceBase,
        motherConfig.spawnChancePerLevel,
        motherConfig.spawnChanceMax,
        level
      ) * chanceMultiplier
      )

      if (Math.random() < motherChance) {
        return 'mother'
      }
    }

    return 'worker'
  }

  private createEnemy(type: EnemyType, viewport: ViewportBounds, positionOverride?: { x: number; y: number }): EnemyEntity {
    const preset = GAME_CONFIG.enemy[type]
    const enemy = this.pool.pop() ?? {
      id: `enemy-${enemyId++}`,
      position: { x: 0, y: 0 },
      size: { ...preset.size },
      type,
      baseSpeed: preset.speed,
      currentSpeed: preset.speed,
      tapsRequired: preset.tapsRequired,
      tapsTaken: 0,
      scoreValue: preset.scoreValue,
      state: 'falling' as const,
      stateTimeLeftMs: 0,
      tapFeedbackTimeLeftMs: 0,
      buffs: createBuffState(),
      spawnDriftTimeLeftMs: 0,
      spawnDriftVelocityX: 0,
      leapDelayMs: 0,
      leapTimeLeftMs: 0,
      leapDurationMs: 0,
      leapDistanceY: 0,
      leapAppliedOffsetY: 0,
      swerveDelayMs: 0,
      swerveTimeLeftMs: 0,
      swerveVelocityX: 0
    }

    enemy.id = `enemy-${enemyId++}`
    enemy.type = type
    enemy.size = { ...preset.size }
    enemy.baseSpeed = preset.speed
    enemy.currentSpeed = preset.speed
    enemy.tapsRequired = preset.tapsRequired
    enemy.tapsTaken = 0
    enemy.scoreValue = preset.scoreValue
    enemy.state = 'falling'
    enemy.stateTimeLeftMs = 0
    enemy.tapFeedbackTimeLeftMs = 0
    enemy.buffs = createBuffState()
    enemy.spawnDriftTimeLeftMs = 0
    enemy.spawnDriftVelocityX = 0
    enemy.leapDelayMs = 0
    enemy.leapTimeLeftMs = 0
    enemy.leapDurationMs = 0
    enemy.leapDistanceY = 0
    enemy.leapAppliedOffsetY = 0
    enemy.swerveDelayMs = 0
    enemy.swerveTimeLeftMs = 0
    enemy.swerveVelocityX = 0

    enemy.position.x =
      positionOverride?.x ??
      randomBetween(0, Math.max(0, viewport.width - enemy.size.width))
    enemy.position.y =
      positionOverride?.y ??
      (-enemy.size.height - randomBetween(16, 120))

    enemy.position.x = this.clampEnemyX(enemy.position.x, enemy.size.width, viewport.width)

    return enemy
  }

  private applyGroundEnemyBuffs(enemy: EnemyEntity, level: number, chanceMultiplier: number): void {
    const { armor, leap, speedBoost, swerve } = GAME_CONFIG.enemy.buffs

    if (Math.random() < Math.min(1, getChanceForLevel(speedBoost.chanceBase, speedBoost.chancePerLevel, speedBoost.chanceMax, level) * chanceMultiplier)) {
      enemy.buffs.speedBoost = true
      enemy.currentSpeed = enemy.baseSpeed * speedBoost.speedMultiplier
    }

    if (Math.random() < Math.min(1, getChanceForLevel(swerve.chanceBase, swerve.chancePerLevel, swerve.chanceMax, level) * chanceMultiplier)) {
      enemy.buffs.swerve = true
      enemy.swerveDelayMs = randomBetween(swerve.delayMinMs, swerve.delayMaxMs)
      enemy.swerveTimeLeftMs = randomBetween(swerve.durationMinMs, swerve.durationMaxMs)
      enemy.swerveVelocityX = enemy.baseSpeed * swerve.horizontalSpeedMultiplier * (Math.random() > 0.5 ? 1 : -1)
    }

    if (enemy.type === 'worker') {
      if (Math.random() < Math.min(1, getChanceForLevel(armor.chanceBase, armor.chancePerLevel, armor.chanceMax, level) * chanceMultiplier)) {
        enemy.buffs.armor = true
        enemy.tapsRequired = armor.tapsRequired
      }
    }

    if (enemy.type === 'flea') {
      if (Math.random() < Math.min(1, getChanceForLevel(leap.chanceBase, leap.chancePerLevel, leap.chanceMax, level) * chanceMultiplier)) {
        enemy.buffs.leap = true
        enemy.leapDelayMs = randomBetween(leap.delayMinMs, leap.delayMaxMs)
        enemy.leapDurationMs = randomBetween(leap.durationMinMs, leap.durationMaxMs)
        enemy.leapTimeLeftMs = enemy.leapDurationMs
        enemy.leapDistanceY = randomBetween(leap.distanceMin, leap.distanceMax)
        enemy.leapAppliedOffsetY = 0
      }
    }
  }

  private crushEnemy(enemy: EnemyEntity, viewport: ViewportBounds): void {
    if (enemy.state !== 'falling') {
      return
    }

    enemy.state = 'crushed'
    enemy.stateTimeLeftMs = GAME_CONFIG.enemy.crushedDurationMs
    enemy.tapFeedbackTimeLeftMs = 0
    this.activeEnemyCount = Math.max(0, this.activeEnemyCount - 1)

    if (enemy.type === 'mother') {
      this.spawnScoutsFromMother(enemy, viewport)
    }
  }

  private spawnScoutsFromMother(enemy: EnemyEntity, viewport: ViewportBounds): void {
    const count = GAME_CONFIG.enemy.mother.spawnedScouts
    const centerX = enemy.position.x + enemy.size.width / 2
    const centerY = enemy.position.y + enemy.size.height / 2

    for (let index = 0; index < count; index += 1) {
      const offsetFromCenter = index - (count - 1) / 2
      const spawnX =
        centerX -
        GAME_CONFIG.enemy.scout.size.width / 2 +
        offsetFromCenter * GAME_CONFIG.enemy.childSpawnSpread
      const spawnY = centerY - GAME_CONFIG.enemy.scout.size.height / 2

      const scout = this.createEnemy('scout', viewport, { x: spawnX, y: spawnY })
      scout.spawnDriftTimeLeftMs = GAME_CONFIG.enemy.childSpawnDriftDurationMs
      scout.spawnDriftVelocityX =
        offsetFromCenter * GAME_CONFIG.enemy.childSpawnDriftVelocityX
      this.enemies.push(scout)
    }
  }

  private findEnemyAtPoint(x: number, y: number): EnemyEntity | null {
    let closestEnemy: EnemyEntity | null = null
    let closestDistance = Number.POSITIVE_INFINITY

    for (const enemy of this.enemies) {
      if (enemy.state !== 'falling') {
        continue
      }

      if (!this.containsPoint(enemy, x, y)) {
        continue
      }

      const enemyCenterX = enemy.position.x + enemy.size.width / 2
      const enemyCenterY = enemy.position.y + enemy.size.height / 2
      const distance = Math.hypot(x - enemyCenterX, y - enemyCenterY)

      if (distance < closestDistance) {
        closestDistance = distance
        closestEnemy = enemy
      }
    }

    return closestEnemy
  }

  private containsPoint(enemy: EnemyEntity, x: number, y: number): boolean {
    const expandedWidth = Math.max(enemy.size.width, GAME_CONFIG.enemy.minimumTapSize)
    const expandedHeight = Math.max(enemy.size.height, GAME_CONFIG.enemy.minimumTapSize)
    const paddingX = Math.max(GAME_CONFIG.enemy.tapPadding, (expandedWidth - enemy.size.width) / 2)
    const paddingY = Math.max(GAME_CONFIG.enemy.tapPadding, (expandedHeight - enemy.size.height) / 2)

    return (
      x >= enemy.position.x - paddingX &&
      x <= enemy.position.x + enemy.size.width + paddingX &&
      y >= enemy.position.y - paddingY &&
      y <= enemy.position.y + enemy.size.height + paddingY
    )
  }

  private clampEnemyX(x: number, enemyWidth: number, viewportWidth: number): number {
    const sideInset = GAME_CONFIG.enemy.spawnSideInset
    const minX = Math.min(sideInset, Math.max(0, viewportWidth - enemyWidth))
    const maxX = Math.max(minX, viewportWidth - enemyWidth - sideInset)

    return clamp(x, minX, maxX)
  }
}
