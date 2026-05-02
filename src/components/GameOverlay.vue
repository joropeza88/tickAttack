<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
  buttonLabel: string
  isButtonPressed: boolean
  isDisabled: boolean
  isLoading: boolean
  showProgress: boolean
  progress: number
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/35 px-8 text-center text-white backdrop-blur-sm">
    <p class="text-xs font-semibold uppercase tracking-[0.4em] text-amber-200">
      {{ eyebrow }}
    </p>
    <h2 class="mt-3 text-4xl font-black tracking-tight">
      {{ title }}
    </h2>
    <p class="mt-3 max-w-xs text-sm leading-6 text-white/80">
      {{ description }}
    </p>

    <div
      v-if="showProgress"
      class="mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/20"
    >
      <div
        class="h-full rounded-full bg-amber-300 transition-[width] duration-200"
        :style="{ width: `${progress}%` }"
      />
    </div>

    <button
      class="mt-6 rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.25em] text-stone-900 transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
      :class="{ 'button-press-pop': isButtonPressed }"
      :disabled="isDisabled"
      @click="$emit('action')"
    >
      {{ isLoading ? 'Cargando...' : buttonLabel }}
    </button>
  </div>
</template>
