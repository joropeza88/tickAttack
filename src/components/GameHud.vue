<script setup lang="ts">
defineProps<{
  score: number
  lives: number
  level: number
  levelProgress: number
  abilityUsesRemaining: number
  isAbilityArming: boolean
}>()

const heartSlots = [0, 1, 2]

defineEmits<{
  skillPointerdown: [event: PointerEvent]
}>()
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 top-10 z-10 px-3">
    <div class="flex items-center justify-between gap-3">
      <div class="flex flex-col">
        <span class="text-white text-xl font-black">NIVEL {{ level }}</span>
        <span class="text-white text-xl font-black">PUNTOS {{ score }}</span>
      </div>

      <div class="flex items-center gap-2 px-3 py-2">
        <div
          v-for="slot in heartSlots"
          :key="slot"
          class="heart-chip"
          :class="slot < lives ? 'heart-chip-live' : 'heart-chip-lost'"
        >
          <span class="heart-glyph">♥</span>
        </div>
      </div>
    </div>

  </div>

   <div class="absolute left-3 top-1/2 z-10 -translate-y-1/2">
      <div class="level-progress-track">
        <div
          class="level-progress-fill"
          :style="{ height: `${Math.max(0, Math.min(1, levelProgress)) * 100}%` }"
        />
      </div>
    </div>

    <div class="absolute right-3 top-30 z-20 -translate-y-1/2 pointer-events-auto">
      <button
        class="ability-button"
        :class="abilityUsesRemaining > 0 ? (isAbilityArming ? 'ability-button-arming' : 'ability-button-ready') : 'ability-button-spent'"
        :disabled="abilityUsesRemaining <= 0"
        @pointerdown.prevent.stop="$emit('skillPointerdown', $event)"
      >
        <img
          src="/images/raid.png"
          alt="Insecticida"
          class="ability-button-image drop-shadow-md"
        >
      </button>
    </div>
</template>
