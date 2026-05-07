<script setup lang="ts">
import { computed } from 'vue'
import ExitButton from '@/components/ExitButton.vue'
import { GAME_CONFIG } from '@/core/config'
import type { GameProgress } from '@/core/progressStorage'

const props = defineProps<{
  progress: GameProgress
}>()

const emit = defineEmits<{
  exit: []
  selectLevel: [level: number]
}>()

const levels = computed(() =>
  Array.from({ length: GAME_CONFIG.progression.victoryLevel }, (_, index) => {
    const level = index + 1
    const isUnlocked = level <= props.progress.highestUnlockedLevel
    const isCompleted = level <= props.progress.highestCompletedLevel
    const statusLabel = isCompleted
      ? 'cursado'
      : isUnlocked
        ? 'abierto'
        : 'BLOQUEADO'

    return {
      level,
      isUnlocked,
      isCompleted,
      statusLabel
    }
  })
)

const onSelectLevel = (level: number, isUnlocked: boolean) => {
  if (!isUnlocked) {
    return
  }

  emit('selectLevel', level)
}
</script>

<template>
  <main class="relative mx-auto flex h-dvh w-full max-w-md flex-col justify-center overflow-hidden bg-[url('/images/game.webp')] bg-cover bg-center px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-white">
    <div class="absolute inset-0 bg-stone-950/50" />

    <section class="relative z-10 px-2 py-8">
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="item in levels"
          :key="item.level"
          class="flex aspect-[0.92] flex-col items-center justify-center rounded-2xl border px-2 py-3 transition"
          :class="item.isUnlocked
            ? item.isCompleted
              ? 'border-amber-200/60 bg-amber-300 text-stone-950 hover:scale-[1.02]'
              : 'border-white/30 bg-white/10 text-white hover:scale-[1.02]'
            : 'border-white/10 bg-black/25 text-white/25'"
          :disabled="!item.isUnlocked"
          @click="onSelectLevel(item.level, item.isUnlocked)"
        >
          <span class="text-xl font-black leading-none">
            {{ item.level }}
          </span>
          <span
            class="mt-2 leading-none"
            :class="item.isUnlocked
              ? item.isCompleted
                ? 'text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-800/80'
                : 'text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75'
              : 'text-xs font-semibold uppercase tracking-[0.14em] text-white/35'"
          >
            {{ item.statusLabel }}
          </span>
        </button>
      </div>
    </section>

    <ExitButton @action="$emit('exit')" />
  </main>
</template>
