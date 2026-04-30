import type { Size, ViewportBounds } from '@/models/game'

export const GAME_CONFIG = {
  initialLives: 3,
  spawnIntervalMs: 920,
  loading: {
    preloadPublicAssetsBeforeStart: true,
    publicAssetUrls: ['images/game.jpg', 'images/dog.png', 'images/tick.png', 'images/tick_crushed.png', 'images/mother_tick.png', 'images/raid.png'] as const
  },
  progression: {
    levelDurationMs: 30000,
    lastWaveTriggerMs: 5000,
    lastWaveBannerDurationMs: 1400,
    lastWaveSpawnIntervalMs: 420,
    lastWaveExtraEnemies: 2,
    lastWaveSpawnBurst: 3,
    lastWaveChanceMultiplier: 1.45,
    levelTransitionDurationMs: 1800,
    baseMaxEnemies: 3,
    extraEnemyEveryLevels: 2,
    maxEnemiesCap: 8
  },
  player: {
    height: 88,
    bottomOffset: 8
  },
  ability: {
    usesPerLevel: 1,
    gasCloudDurationMs: 3000,
    gasCloudRadius: 82
  },
  enemy: {
    scout: {
      speed: 100,
      scoreValue: 1,
      tapsRequired: 1,
      size: { width: 20, height: 20 } satisfies Size
    },
    worker: {
      speed: 150,
      scoreValue: 1,
      tapsRequired: 1,
      size: { width: 30, height: 30 } satisfies Size
    },
    mother: {
      speed: 50,
      scoreValue: 4,
      tapsRequired: 3,
      minLevel: 5,
      size: { width: 56, height: 56 } satisfies Size,
      spawnChanceBase: 0.035,
      spawnChancePerLevel: 0.012,
      spawnChanceMax: 0.11,
      spawnedScouts: 3
    },
    buffs: {
      speedBoost: {
        chanceBase: 0.045,
        chancePerLevel: 0.01,
        chanceMax: 0.16,
        speedMultiplier: 1.28
      },
      swerve: {
        chanceBase: 0.05,
        chancePerLevel: 0.012,
        chanceMax: 0.18,
        horizontalSpeedMultiplier: 0.52,
        durationMinMs: 260,
        durationMaxMs: 620,
        delayMinMs: 180,
        delayMaxMs: 900
      },
      armor: {
        chanceBase: 0.028,
        chancePerLevel: 0.008,
        chanceMax: 0.12,
        tapsRequired: 2,
        slowMultiplierOnHit: 0.58
      }
    },
    tapPadding: 18,
    minimumTapSize: 56,
    spawnSideInset: 28,
    crushedDurationMs: 260,
    hitFeedbackDurationMs: 170,
    childSpawnSpread: 18,
    despawnOffset: 120
  },
  viewport: {
    width: 360,
    height: 640
  } satisfies ViewportBounds
} as const
