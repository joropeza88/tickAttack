import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { GameEngine } from '@/core/gameEngine'
import { GAME_CONFIG } from '@/core/config'
import type { GameSnapshot } from '@/models/game'

const initialSnapshot: GameSnapshot = {
  status: 'idle',
  score: 0,
  lives: GAME_CONFIG.initialLives,
  level: 1,
  abilityUsesRemaining: GAME_CONFIG.ability.usesPerLevel,
  waveStartCue: 0,
  levelPhase: 'playing',
  upcomingLevel: 2,
  isLastWave: false,
  levelProgress: 0,
  levelTimeRemainingMs: GAME_CONFIG.progression.levelDurationMs,
  lastWaveBannerTimeLeftMs: 0,
  levelTransitionTimeLeftMs: 0,
  player: {
    id: 'player',
    position: { x: 0, y: 0 },
    size: { width: GAME_CONFIG.viewport.width, height: GAME_CONFIG.player.height }
  },
  gasCloud: {
    active: false,
    position: { x: 0, y: 0 },
    radius: GAME_CONFIG.ability.gasCloudRadius,
    timeLeftMs: 0
  },
  enemies: [],
  hitFlash: 0,
  hitCount: 0
}

export function useGame() {
  const containerRef = ref<HTMLElement | null>(null)
  const snapshot = reactive<GameSnapshot>({ ...initialSnapshot })
  const engine = new GameEngine({
    onFrame: (nextSnapshot) => {
      Object.assign(snapshot, nextSnapshot)
    }
  })

  const resizeViewport = () => {
    const rect = containerRef.value?.getBoundingClientRect()
    if (!rect) {
      return
    }

    engine.setViewport(rect.width, rect.height)
  }

  onMounted(() => {
    resizeViewport()
    window.addEventListener('resize', resizeViewport)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeViewport)
    engine.stop()
  })

  const isRunning = computed(() => snapshot.status === 'running')

  return {
    containerRef,
    snapshot,
    start: () => engine.start(),
    restart: () => engine.restart(),
    stop: () => engine.stop(),
    isRunning,
    tapAt: (localX: number, localY: number) => engine.tap(localX, localY),
    deployGasCloudAt: (localX: number, localY: number) => engine.deployGasCloud(localX, localY)
  }
}
