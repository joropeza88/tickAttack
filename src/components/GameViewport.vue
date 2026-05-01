<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import DogSprite from '@/components/DogSprite.vue'
import EnemySprite from '@/components/EnemySprite.vue'
import GameHud from '@/components/GameHud.vue'
import LevelIntroBanner from '@/components/LevelIntroBanner.vue'
import GameOverlay from '@/components/GameOverlay.vue'
import { GAME_CONFIG } from '@/core/config'
import { useGame } from '@/composables/useGame'
import { usePublicAssetPreloader } from '@/composables/usePublicAssetPreloader'

const { containerRef, snapshot, isRunning, restart, start, tapAt, deployGasCloudAt } = useGame()
const crySound = typeof Audio !== 'undefined' ? new Audio('sounds/cry.wav') : null
const biteSound = typeof Audio !== 'undefined' ? new Audio('sounds/bite.mp3') : null
const crushSound = typeof Audio !== 'undefined' ? new Audio('sounds/crush.mp3') : null
const spraySound = typeof Audio !== 'undefined' ? new Audio('sounds/spray.mp3') : null
const musicSound = typeof Audio !== 'undefined' ? new Audio('sounds/music.mp3') : null

const isLastWaveBannerVisible = computed(() => isRunning.value && snapshot.lastWaveBannerTimeLeftMs > 0)
const isLevelTransitionVisible = computed(() => isRunning.value && snapshot.levelTransitionTimeLeftMs > 0)
const abilityAim = reactive({
  active: false,
  pointerId: -1,
  x: 0,
  y: 0,
  insideViewport: false
})
const showAbilityPreview = computed(
  () => abilityAim.active && abilityAim.insideViewport && snapshot.abilityUsesRemaining > 0
)

if (crySound) {
  crySound.preload = 'auto'
}

if (biteSound) {
  biteSound.preload = 'auto'
}

if (crushSound) {
  crushSound.preload = 'auto'
  crushSound.volume = 0.75
}

if (spraySound) {
  spraySound.preload = 'auto'
  spraySound.volume = 0.85
}

if (musicSound) {
  musicSound.preload = 'auto'
  musicSound.loop = true
  musicSound.volume = 0.45
}

const {
  errorMessage: preloadErrorMessage,
  isEnabled: preloadEnabled,
  isLoading: isPreloading,
  isReady: areAssetsReady,
  preload,
  progress: preloadProgress
} = usePublicAssetPreloader({
  enabled: GAME_CONFIG.loading.preloadPublicAssetsBeforeStart,
  imageUrls: GAME_CONFIG.loading.publicAssetUrls,
  audioElements: [crySound, biteSound, crushSound, spraySound, musicSound]
})

const startBackgroundMusic = async () => {
  if (!musicSound || !musicSound.paused) {
    return
  }

  try {
    await musicSound.play()
  } catch {
    // El navegador puede bloquear autoplay hasta que exista interacción.
  }
}

const isStartBlocked = computed(() => preloadEnabled && !areAssetsReady.value)
const hasPreloadError = computed(() => preloadErrorMessage.value.length > 0)

const overlayEyebrow = computed(() => {
  if (isPreloading.value) {
    return 'Loading'
  }

  if (hasPreloadError.value) {
    return 'Carga pendiente'
  }

  return snapshot.status === 'game-over' ? 'Game Over' : 'Ready'
})

const overlayTitle = computed(() => {
  if (isPreloading.value) {
    return `Cargando recursos ${preloadProgress.value}%`
  }

  if (hasPreloadError.value) {
    return 'No se completó la precarga'
  }

  return snapshot.status === 'game-over' ? 'El perro fue alcanzado' : 'Protege al perro'
})

const overlayDescription = computed(() => {
  if (isPreloading.value) {
    return 'Preparando imágenes y sonidos del juego para que el inicio no tenga saltos ni cargas tardías.'
  }

  if (hasPreloadError.value) {
    return preloadErrorMessage.value
  }

  return 'Toca cada enemigo antes de que llegue al perro. El perro ahora se queda fijo abajo y ocupa todo el ancho.'
})

const onViewportPointerDown = (event: PointerEvent) => {
  if (!isRunning.value) {
    return
  }

  if (abilityAim.active) {
    return
  }

  const element = event.currentTarget
  if (!(element instanceof HTMLElement)) {
    return
  }

  const rect = element.getBoundingClientRect()
  const resolution = tapAt(event.clientX - rect.left, event.clientY - rect.top)

  if (resolution.killed && crushSound) {
    crushSound.currentTime = 0
    void crushSound.play().catch(() => {})
  }
}

const updateAbilityAimFromPoint = (clientX: number, clientY: number) => {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) {
    abilityAim.insideViewport = false
    return
  }

  const localX = clientX - rect.left
  const localY = clientY - rect.top

  abilityAim.x = localX
  abilityAim.y = localY
  abilityAim.insideViewport =
    localX >= 0 &&
    localX <= rect.width &&
    localY >= 0 &&
    localY <= rect.height
}

const stopAbilityAim = () => {
  abilityAim.active = false
  abilityAim.pointerId = -1
  abilityAim.insideViewport = false
}

const onWindowPointerMove = (event: PointerEvent) => {
  if (!abilityAim.active || event.pointerId !== abilityAim.pointerId) {
    return
  }

  updateAbilityAimFromPoint(event.clientX, event.clientY)
}

const onWindowPointerUp = (event: PointerEvent) => {
  if (!abilityAim.active || event.pointerId !== abilityAim.pointerId) {
    return
  }

  updateAbilityAimFromPoint(event.clientX, event.clientY)

  if (abilityAim.insideViewport && snapshot.abilityUsesRemaining > 0) {
    const didDeploy = deployGasCloudAt(abilityAim.x, abilityAim.y)

    if (didDeploy && spraySound) {
      spraySound.currentTime = 0.2
      void spraySound.play().catch(() => {})
    }
  }

  stopAbilityAim()
}

const onSkillPointerDown = (event: PointerEvent) => {
  if (!isRunning.value || snapshot.abilityUsesRemaining <= 0) {
    return
  }

  const target = event.currentTarget
  if (target instanceof Element && 'setPointerCapture' in target) {
    target.setPointerCapture(event.pointerId)
  }

  abilityAim.active = true
  abilityAim.pointerId = event.pointerId
  updateAbilityAimFromPoint(event.clientX, event.clientY)
}

const onStartOrRestart = () => {
  if (hasPreloadError.value) {
    void preload().catch(() => {})
    return
  }

  if (isStartBlocked.value) {
    return
  }

  void startBackgroundMusic()

  if (snapshot.status === 'game-over') {
    restart()
    return
  }

  start()
}

watch(
  () => snapshot.lives,
  (lives, previousLives) => {
    if (!crySound || !biteSound || previousLives == null || snapshot.status !== 'running') {
      return
    }

    if (lives >= previousLives) {
      return
    }

    biteSound.currentTime = 1
    crySound.currentTime = 0
    void biteSound.play().catch(() => {})
    void crySound.play().catch(() => {})
  }
)

onMounted(() => {
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('pointercancel', onWindowPointerUp)
  void preload()
    .then(() => startBackgroundMusic())
    .catch(() => {})
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
  window.removeEventListener('pointercancel', onWindowPointerUp)

  if (biteSound) {
    biteSound.pause()
    biteSound.currentTime = 0
  }

  if (crySound) {
    crySound.pause()
    crySound.currentTime = 0
  }

  if (crushSound) {
    crushSound.pause()
    crushSound.currentTime = 0
  }

  if (spraySound) {
    spraySound.pause()
    spraySound.currentTime = 0
  }

  if (musicSound) {
    musicSound.pause()
    musicSound.currentTime = 0
  }
})
</script>

<template>
  <main class="relative mx-auto flex h-dvh w-full max-w-md flex-col bg-[url('/images/game.png')] bg-cover bg-top pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    <GameHud
      :score="snapshot.score"
      :lives="snapshot.lives"
      :level="snapshot.level"
      :level-progress="snapshot.levelProgress"
      :ability-uses-remaining="snapshot.abilityUsesRemaining"
      :is-ability-arming="abilityAim.active"
      @skill-pointerdown="onSkillPointerDown"
    />

    <section
      ref="containerRef"
      class="relative flex-1 overflow-hidden px-4"
      style="touch-action: none"
      @pointerdown="onViewportPointerDown"
    >
      <div
        v-if="showAbilityPreview"
        class="pointer-events-none absolute"
        :style="{
          left: '0px',
          top: '0px',
          width: `${GAME_CONFIG.ability.gasCloudRadius * 2}px`,
          height: `${GAME_CONFIG.ability.gasCloudRadius * 2}px`,
          transform: `translate3d(${abilityAim.x - GAME_CONFIG.ability.gasCloudRadius}px, ${abilityAim.y - GAME_CONFIG.ability.gasCloudRadius}px, 0)`
        }"
      >
        <div class="gas-cloud-preview h-full w-full" />
      </div>

      <div
        v-if="snapshot.gasCloud.active"
        class="pointer-events-none absolute"
        :style="{
          left: '0px',
          top: '0px',
          width: `${snapshot.gasCloud.radius * 2}px`,
          height: `${snapshot.gasCloud.radius * 2}px`,
          transform: `translate3d(${snapshot.gasCloud.position.x - snapshot.gasCloud.radius}px, ${snapshot.gasCloud.position.y - snapshot.gasCloud.radius}px, 0)`
        }"
      >
        <div class="gas-cloud-zone h-full w-full" />
      </div>

      <EnemySprite
        v-for="enemy in snapshot.enemies"
        :key="enemy.id"
        :enemy="enemy"
      />

      <DogSprite
        :player="snapshot.player"
        :hit-flash="snapshot.hitFlash"
      />
    </section>

    <LevelIntroBanner
      v-if="isLastWaveBannerVisible"
      :key="`last-wave-${snapshot.level}`"
      eyebrow="Atencion"
      title="Ultima ola"
      variant="warning"
    />

    <LevelIntroBanner
      v-if="isLevelTransitionVisible"
      :key="`next-level-${snapshot.upcomingLevel}`"
      eyebrow="Siguiente nivel"
      :title="`Nivel ${snapshot.upcomingLevel}`"
      variant="level"
    />

    <GameOverlay
      v-if="snapshot.status !== 'running'"
      :eyebrow="overlayEyebrow"
      :title="overlayTitle"
      :description="overlayDescription"
      :is-disabled="isStartBlocked"
      :is-loading="isPreloading"
      :show-progress="preloadEnabled"
      :progress="preloadProgress"
      :button-label="
        isPreloading
          ? 'Cargando...'
          : hasPreloadError
            ? 'Reintentar carga'
            : snapshot.status === 'game-over'
              ? 'Reintentar'
              : 'Empezar'
      "
      @action="onStartOrRestart"
    />
  </main>
</template>
