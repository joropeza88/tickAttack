import type { Size, ViewportBounds } from '@/models/game'

export const GAME_CONFIG = {
  initialLives: 3,
  loading: {
    preloadPublicAssetsBeforeStart: true,
    publicAssetUrls: ['images/flea_crushed.png', 'images/flea_sprite.png', 'images/game.png', 'images/game_night.png', 'images/dog.png', 'images/stain.png', 'images/tick_crushed.png', 'images/raid.png', 'images/tick_mother_sprite.png', 'images/tick_sprite.png'] as const,
    publicAudioUrls: ['sounds/applause.mp3', 'sounds/cry.wav', 'sounds/bite.mp3', 'sounds/button-press.mp3', 'sounds/chajchas.mp3', 'sounds/crush.mp3', 'sounds/spray.mp3', 'sounds/music.mp3'] as const
  },
  progression: {
    levelDurationMs: 30000,
    baseWaveIntervalMs: 3000,
    waveIntervalReductionPerLevelMs: 80,
    lastWaveDurationMs: 6000,
    lastWaveIntervalMs: 1500,
    lastWaveBannerDurationMs: 1400,
    baseEnemiesPerWave: 1,
    extraWaveEnemyEveryLevels: 3,
    maxEnemiesPerWave: 4,
    lastWaveExtraEnemies: 1,
    lastWaveChanceMultiplier: 1.45,
    levelTransitionDurationMs: 1800,
    victoryLevel: 13
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
      scoreValue: 3,
      tapsRequired: 1,
      size: { width: 30, height: 30 } satisfies Size
    },
    flea: {
      speed: 165,
      scoreValue: 2,
      tapsRequired: 1,
      minLevel: 3,
      size: { width: 24, height: 24 } satisfies Size,
      spawnChanceBase: 0.07,
      spawnChancePerLevel: 0.012,
      spawnChanceMax: 0.18
    },
    mother: {
      speed: 50,
      scoreValue: 6,
      tapsRequired: 3,
      minLevel: 6,
      size: { width: 56, height: 56 } satisfies Size,
      spawnChanceBase: 0.035,
      spawnChancePerLevel: 0.006,
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
        delayMinMs: 500,
        delayMaxMs: 1500
      },
      armor: {
        chanceBase: 0.028,
        chancePerLevel: 0.008,
        chanceMax: 0.12,
        tapsRequired: 2,
        slowMultiplierOnHit: 0.58
      },
      leap: {
        chanceBase: 0.5,
        chancePerLevel: 0,
        chanceMax: 0.5,
        delayMinMs: 1000,
        delayMaxMs: 2000,
        durationMinMs: 120,
        durationMaxMs: 220,
        distanceMin: 24,
        distanceMax: 42
      }
    },
    tapPadding: 18,
    minimumTapSize: 56,
    spawnSideInset: 28,
    crushedDurationMs: 260,
    hitFeedbackDurationMs: 170,
    childSpawnSpread: 26,
    childSpawnDriftDurationMs: 320,
    childSpawnDriftVelocityX: 82,
    despawnOffset: 120
  },
  viewport: {
    width: 360,
    height: 640
  } satisfies ViewportBounds
} as const
