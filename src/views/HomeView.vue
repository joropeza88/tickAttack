<script setup lang="ts">
import { computed } from 'vue'
import { GAME_CONFIG } from '@/core/config'
import { useButtonPressAction } from '@/composables/useButtonPressAction'
import { usePublicAssetPreloader } from '@/composables/usePublicAssetPreloader'

const emit = defineEmits<{
  start: []
}>()

const preloadAudioElements =
  typeof Audio === 'undefined'
    ? []
    : GAME_CONFIG.loading.publicAudioUrls.map((url) => new Audio(url))

for (const audio of preloadAudioElements) {
  audio.preload = 'auto'
}

const {
  errorMessage,
  isEnabled,
  isLoading,
  isReady,
  preload,
  progress
} = usePublicAssetPreloader({
  enabled: GAME_CONFIG.loading.preloadPublicAssetsBeforeStart,
  imageUrls: GAME_CONFIG.loading.publicAssetUrls,
  audioElements: preloadAudioElements
})

const canStart = computed(() => !isEnabled || isReady.value)
const hasError = computed(() => errorMessage.value.length > 0)
const { isPressing: isStartPressing, runPressAction } = useButtonPressAction()

const onStart = () => {
  if (!canStart.value) {
    return
  }

  runPressAction(() => emit('start'))
}

const onRetry = () => {
  void preload().catch(() => {})
}

void preload().catch(() => {})
</script>

<template>
  <main class="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center justify-center overflow-hidden bg-[url('/images/game.png')] bg-cover bg-center px-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white">
    <div class="absolute inset-0 bg-stone-950/45" />

    <section class="relative z-10 flex w-full flex-col items-center text-center">
      <p class="text-sm font-semibold uppercase tracking-[0.45em] text-amber-200">
        Tick Attack
      </p>
      <h1 class="mt-4 text-5xl font-black tracking-tight">
        Protege al perro
      </h1>
      <p class="mt-4 max-w-sm text-sm leading-6 text-white/80">
        Aplasta los enemigos, usa el spray en el momento correcto y sobrevive a cada ola.
      </p>

      <div
        v-if="isEnabled"
        class="mt-8 w-full max-w-xs overflow-hidden rounded-full bg-white/15"
      >
        <div
          class="h-2 rounded-full bg-amber-300 transition-[width] duration-200"
          :style="{ width: `${progress}%` }"
        />
      </div>

      <p
        v-if="isEnabled"
        class="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/70"
      >
        {{ isReady ? 'Recursos listos' : `Cargando recursos ${progress}%` }}
      </p>

      <p
        v-if="hasError"
        class="mt-4 max-w-xs text-sm leading-6 text-rose-200"
      >
        {{ errorMessage }}
      </p>

      <button
        v-if="hasError"
        class="mt-5 rounded-full border border-white/30 px-5 py-3 text-sm font-bold uppercase tracking-[0.22em] text-white transition hover:bg-white/10"
        @click="onRetry"
      >
        Reintentar carga
      </button>

      <button
        class="mt-6 rounded-full bg-white px-7 py-3 text-sm font-bold uppercase tracking-[0.25em] text-stone-900 transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
        :class="{ 'button-press-pop': isStartPressing }"
        :disabled="!canStart || isLoading"
        @click="onStart"
      >
        {{ isLoading && !isReady ? 'Cargando...' : 'Jugar' }}
      </button>
    </section>
  </main>
</template>
