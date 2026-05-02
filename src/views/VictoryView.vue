<script setup lang="ts">
import { useButtonPressAction } from '@/composables/useButtonPressAction'

const emit = defineEmits<{
  exit: []
}>()

const { isPressing: isExitPressing, runPressAction } = useButtonPressAction()

const onExit = () => {
  runPressAction(() => emit('exit'))
}
</script>

<template>
  <main class="relative mx-auto flex h-dvh w-full max-w-md flex-col items-center justify-center overflow-hidden bg-[url('/images/game.png')] bg-cover bg-center px-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white">
    <div class="absolute inset-0 bg-emerald-950/45" />

    <section class="relative z-10 flex w-full flex-col items-center text-center">
      <p class="text-sm font-semibold uppercase tracking-[0.45em] text-emerald-200">
        Victoria
      </p>
      <h1 class="mt-4 text-5xl font-black tracking-tight">
        Mision cumplida
      </h1>
      <p class="mt-4 max-w-sm text-sm leading-6 text-white/80">
        El perro sobrevivió a todas las oleadas configuradas. Puedes salir para volver a la pantalla inicial.
      </p>

      <button
        class="mt-8 rounded-full bg-white px-7 py-3 text-sm font-bold uppercase tracking-[0.25em] text-stone-900 transition hover:scale-[1.02]"
        :class="{ 'button-press-pop': isExitPressing }"
        @click="onExit"
      >
        Salir
      </button>
    </section>
  </main>
</template>
