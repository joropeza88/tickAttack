<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import DogSprite from '@/components/DogSprite.vue'
import EnemySprite from '@/components/EnemySprite.vue'
import GameHud from '@/components/GameHud.vue'
import LevelIntroBanner from '@/components/LevelIntroBanner.vue'
import GameOverlay from '@/components/GameOverlay.vue'
import { useButtonPressAction } from '@/composables/useButtonPressAction'
import { GAME_CONFIG } from '@/core/config'
import { useGame } from '@/composables/useGame'

const emit = defineEmits<{
  exit: []
  completed: []
}>()

const { containerRef, snapshot, isRunning, restart, start, tapAt, deployGasCloudAt } = useGame()
const crySound = typeof Audio !== 'undefined' ? new Audio('sounds/cry.wav') : null
const biteSound = typeof Audio !== 'undefined' ? new Audio('sounds/bite.mp3') : null
const bangSound = typeof Audio !== 'undefined' ? new Audio('sounds/bang.mp3') : null
const footstepsSound = typeof Audio !== 'undefined' ? new Audio('sounds/chajchas.mp3') : null
const crushSound = typeof Audio !== 'undefined' ? new Audio('sounds/crush.mp3') : null
const spraySound = typeof Audio !== 'undefined' ? new Audio('sounds/spray.mp3') : null
const musicSound = typeof Audio !== 'undefined' ? new Audio('sounds/music.mp3') : null

const isLastWaveBannerVisible = computed(() => isRunning.value && snapshot.lastWaveBannerTimeLeftMs > 0)
const isLevelTransitionVisible = computed(() => isRunning.value && snapshot.levelTransitionTimeLeftMs > 0)
const isNightLevel = computed(() => snapshot.level % 2 === 0)
const backgroundImageUrl = computed(() =>
  isNightLevel.value ? '/images/game_night.png' : '/images/game.png'
)
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
const { isPressing: isExitPressing, runPressAction: runExitPressAction } = useButtonPressAction()
const { isPressing: isRetryPressing, runPressAction: runRetryPressAction } = useButtonPressAction()

if (crySound) {
  crySound.preload = 'auto'
}

if (biteSound) {
  biteSound.preload = 'auto'
}

if (bangSound) {
  bangSound.preload = 'auto'
}

if (footstepsSound) {
  footstepsSound.preload = 'auto'
  footstepsSound.loop = true
  footstepsSound.volume = 0
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
  musicSound.volume = .3
}

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

const startFootstepsLoop = async () => {
  if (!footstepsSound || !footstepsSound.paused) {
    return
  }

  try {
    await footstepsSound.play()
  } catch {
    // Igual que la musica, puede bloquearse hasta que exista interacción.
  }
}

const getFootstepsVolume = () => {
  if (snapshot.status !== 'running') {
    return 0
  }

  const activeEnemies = snapshot.activeEnemyCount

  if (activeEnemies <= 1) {
    return 0
  }

  if (snapshot.levelPhase === 'last-wave') {
    return activeEnemies >= 6 ? 0.12 : 0.1
  }

  if (activeEnemies >= 6) {
    return 0.1
  }

  if (activeEnemies >= 4) {
    return 0.075
  }

  return 0.05
}

const syncFootstepsAmbience = () => {
  if (!footstepsSound) {
    return
  }

  const targetVolume = getFootstepsVolume()
  footstepsSound.volume = targetVolume

  if (targetVolume > 0) {
    void startFootstepsLoop()
    return
  }

  footstepsSound.pause()
  footstepsSound.currentTime = 0
}

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

  if (resolution.hit && !resolution.killed && bangSound) {
    bangSound.currentTime = 0.2
    void bangSound.play().catch(() => {})
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

const onRestart = () => {
  runRetryPressAction(() => {
    void startBackgroundMusic()
    void startFootstepsLoop()
    restart()
  })
}

const onExit = () => {
  runExitPressAction(() => emit('exit'))
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
    crySound.currentTime = 0.25
    void biteSound.play().catch(() => {})
    void crySound.play().catch(() => {})
  }
)

watch(
  () => snapshot.status,
  (status, previousStatus) => {
    if (status === 'victory' && previousStatus !== 'victory') {
      emit('completed')
    }
  }
)

watch(
  () => [snapshot.status, snapshot.levelPhase, snapshot.activeEnemyCount],
  () => {
    syncFootstepsAmbience()
  }
)

onMounted(() => {
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('pointercancel', onWindowPointerUp)
  start()
  void startBackgroundMusic()
  syncFootstepsAmbience()
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

  if (footstepsSound) {
    footstepsSound.pause()
    footstepsSound.currentTime = 0
  }

  if (bangSound) {
    bangSound.pause()
    bangSound.currentTime = 0
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
  <main
    class="relative mx-auto flex h-dvh w-full max-w-md flex-col bg-cover bg-top pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
  >
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
        <div class="gas-cloud-ring h-full w-full" />
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

      <div
        v-if="isNightLevel"
        class="pointer-events-none absolute inset-0 z-10 bg-black/12"
      />

      <button
        class="absolute left-2 bottom-4 z-20 rounded-full bg-white p-2 transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
        :class="{ 'button-press-pop': isExitPressing }"
        @click="onExit"
      >
        <img src="/images/out.png" class="w-6 h-6"/>
      </button>
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
      v-if="snapshot.status === 'game-over'"
      eyebrow="Game Over"
      title="El perro fue alcanzado"
      description="Toca cada enemigo antes de que llegue al perro."
      :is-button-pressed="isRetryPressing"
      :is-disabled="false"
      :is-loading="false"
      :show-progress="false"
      :progress="0"
      button-label="Reintentar"
      @action="onRestart"
    />
  </main>
</template>
