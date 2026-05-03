<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useButtonPressAction } from '@/composables/useButtonPressAction'

const emit = defineEmits<{
  exit: []
}>()

const { isPressing: isExitPressing, runPressAction } = useButtonPressAction()
const applauseSound = typeof Audio !== 'undefined' ? new Audio('sounds/applause.mp3') : null
const confettiBursts = ref<number[]>([])
let secondBurstTimer = 0

if (applauseSound) {
  applauseSound.preload = 'auto'
  applauseSound.volume = 0.8
}

const onExit = () => {
  runPressAction(() => emit('exit'))
}

async function shareGame() {
  const url = 'https://tick-attack.vercel.app/';
  const title = 'Tick Attack';
  const text = 'Sobreviví las 13 olas de enemigos. ¿Puedes lograrlo tú también?';

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url
      });
      return;
    } catch {
      // Si el usuario cancela o el sistema falla, intentamos el fallback web.
    }
  }

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.location.href = facebookShareUrl;
}


onMounted(() => {
  confettiBursts.value = [0]
  secondBurstTimer = window.setTimeout(() => {
    confettiBursts.value = [0, 1]
  }, 520)

  if (applauseSound) {
    applauseSound.currentTime = 0
    void applauseSound.play().catch(() => {})
  }
})

onBeforeUnmount(() => {
  window.clearTimeout(secondBurstTimer)

  if (applauseSound) {
    applauseSound.pause()
    applauseSound.currentTime = 0
  }
})
</script>

<template>
  <main class="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center justify-center overflow-hidden bg-[url('/images/game.png')] bg-cover bg-center px-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white">
    <div class="absolute inset-0 bg-emerald-950/45" />

    <div class="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <div
        v-for="burst in confettiBursts"
        :key="burst"
        class="absolute left-1/2 top-1/2"
      >
        <span
          v-for="index in 20"
          :key="`${burst}-${index}`"
          class="confetti-piece"
          :style="{
            '--confetti-x': `${Math.cos(((index - 1) / 20) * Math.PI * 2) * (burst === 0 ? 110 : 150)}px`,
            '--confetti-y': `${Math.sin(((index - 1) / 20) * Math.PI * 2) * (burst === 0 ? 90 : 125)}px`,
            '--confetti-rotate': `${(index - 1) * 29}deg`,
            '--confetti-delay': `${burst * 520 + (index % 5) * 16}ms`,
            '--confetti-color': ['#fef08a', '#86efac', '#93c5fd', '#f9a8d4', '#fdba74'][(index - 1) % 5]
          }"
        />
      </div>
    </div>

    <div class="relative z-10 flex w-full flex-col items-center text-center">
      <p class="text-sm font-semibold uppercase tracking-[0.45em] text-emerald-200">
        Victoria
      </p>
      <h1 class="mt-4 text-5xl font-black tracking-tight">
        Mision cumplida
      </h1>
      <p class="mt-4 max-w-sm text-sm leading-6 text-white/80">
        El perro sobrevivió a todas las oleadas de enemigos.
      </p>
      <div class="flex gap-3 items-center mt-8">
        <button
          class="rounded-full bg-white px-7 py-4.5 text-sm font-bold uppercase tracking-[0.25em] text-stone-900 transition hover:scale-[1.02]"
          :class="{ 'button-press-pop': isExitPressing }"
          @click="onExit"
        >
          Salir
        </button>
        <button
          type="button"
          class="
            relative mx-auto flex w-auto py-3 items-center justify-center gap-3
            rounded-full border border-white/12 bg-[linear-gradient(180deg,#1877f2_0%,#1459c6_100%)]
            px-5 text-sm font-bold uppercase text-white
            shadow-[0_14px_26px_rgba(24,119,242,0.28),inset_0_1px_0_rgba(255,255,255,0.18)]
            transition-all duration-150
            active:translate-y-[3px] active:shadow-[0_8px_16px_rgba(24,119,242,0.24)]
          "
          @click="shareGame"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xl font-black text-[#1877f2]">f</span>
          <span class="text-sm uppercase tracking-[0.22em]">Compartir</span>
        </button>
      </div> 
    </div>
  </main>
</template>
