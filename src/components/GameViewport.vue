<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import DogSprite from '@/components/DogSprite.vue'
import EnemySprite from '@/components/EnemySprite.vue'
import GameHud from '@/components/GameHud.vue'
import LevelIntroBanner from '@/components/LevelIntroBanner.vue'
import GameOverlay from '@/components/GameOverlay.vue'
import { useButtonPressAction } from '@/composables/useButtonPressAction'
import { GAME_CONFIG } from '@/core/config'
import { audioManager } from '@/core/audioManager'
import { useGame } from '@/composables/useGame'

const emit = defineEmits<{
  exit: []
  completed: []
}>()

const { containerRef, snapshot, isRunning, restart, start, tapAt, deployGasCloudAt } = useGame()
const isLastWaveBannerVisible = computed(() => isRunning.value && snapshot.lastWaveBannerTimeLeftMs > 0)
const isLevelTransitionVisible = computed(() => isRunning.value && snapshot.levelTransitionTimeLeftMs > 0)
const isNightLevel = computed(() => snapshot.level % 2 === 0)
const backgroundImageUrl = computed(() =>
  isNightLevel.value ? '/images/game_night.webp' : '/images/game.webp'
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

const startBackgroundMusic = async () => {
  await audioManager.play('sounds/music.mp3', { loop: true, volume: 0.3, stopPrevious: true })
}

const playWaveCue = () => {
  if (snapshot.status !== 'running') {
    return
  }

  void audioManager.play('sounds/chajchas.mp3', { volume: 0.28, stopPrevious: true })
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

  if (resolution.killed) {
    void audioManager.play('sounds/crush.mp3', { volume: 0.75 })
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

    if (didDeploy) {
      void audioManager.play('sounds/spray.mp3', { offsetSeconds: 0, volume: 0.85 })
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
    restart()
  })
}

const onExit = () => {
  runExitPressAction(() => emit('exit'))
}

watch(
  () => snapshot.lives,
  (lives, previousLives) => {
    if (previousLives == null || snapshot.status !== 'running') {
      return
    }

    if (lives >= previousLives) {
      return
    }

    triggerBiteVibration()
    void audioManager.play('sounds/bite.mp3', { offsetSeconds: 0, volume: 1 })
    void audioManager.play('sounds/cry.mp3', { offsetSeconds: 0, volume: 1 })
  }
)

function triggerBiteVibration() {
  try {
    const supportsTouch = navigator.maxTouchPoints > 0
      || window.matchMedia?.('(pointer: coarse)').matches

    if (!supportsTouch || typeof navigator.vibrate !== 'function') {
      return
    }

    navigator.vibrate(GAME_CONFIG.biteVibrationMs)
  } catch {
    // Ignore vibration failures on unsupported devices/browsers.
  }
}

watch(
  () => snapshot.status,
  (status, previousStatus) => {
    if (status === 'victory' && previousStatus !== 'victory') {
      emit('completed')
    }
  }
)

watch(
  () => snapshot.waveStartCue,
  (cue, previousCue) => {
    if (cue <= 0 || cue === previousCue) {
      return
    }

    playWaveCue()
  }
)

onMounted(() => {
  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('pointercancel', onWindowPointerUp)
  start()
  void startBackgroundMusic()
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onWindowPointerMove)
  window.removeEventListener('pointerup', onWindowPointerUp)
  window.removeEventListener('pointercancel', onWindowPointerUp)
  audioManager.stop('sounds/bite.mp3')
  audioManager.stop('sounds/cry.mp3')
  audioManager.stop('sounds/crush.mp3')
  audioManager.stop('sounds/chajchas.mp3')
  audioManager.stop('sounds/spray.mp3')
  audioManager.stop('sounds/music.mp3')
})
</script>

<template>
  <main
    class="relative mx-auto flex h-dvh w-full max-w-md flex-col bg-cover bg-top pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
  >
    <div
      v-if="isNightLevel"
      class="pointer-events-none absolute inset-0 z-0 bg-black/12"
    />

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
        v-show="showAbilityPreview"
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
        v-show="snapshot.gasCloud.active"
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
        :hit-count="snapshot.hitCount"
      />

      
      <button
        class="absolute left-2 bottom-6 z-20 rounded-full bg-white p-3 transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
        :class="{ 'button-press-pop': isExitPressing }"
        @click="onExit"
      >
        <img src="/images/out.webp" class="w-6 h-6"/>
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
