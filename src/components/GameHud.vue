<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { publicAssetUrl } from '@/utils/publicAssetUrl'

const props = defineProps<{
  score: number
  lives: number
  level: number
  levelProgress: number
  abilityUsesRemaining: number
  isAbilityArming: boolean
}>()

const heartSlots = [0, 1, 2]
const losingHeartSlots = ref<number[]>([])
const losingHeartTimers = new Map<number, ReturnType<typeof setTimeout>>()
const heartSpriteUrl = publicAssetUrl('images/heart_sprite.webp')
const abilityImageUrl = publicAssetUrl('images/raid.webp')
const heartSpriteStyle = {
  backgroundImage: `url('${heartSpriteUrl}')`
}

const triggerLostHeart = (slot: number) => {
  const existingTimer = losingHeartTimers.get(slot)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  if (!losingHeartSlots.value.includes(slot)) {
    losingHeartSlots.value = [...losingHeartSlots.value, slot]
  }

  const timer = setTimeout(() => {
    losingHeartSlots.value = losingHeartSlots.value.filter((activeSlot) => activeSlot !== slot)
    losingHeartTimers.delete(slot)
  }, 420)

  losingHeartTimers.set(slot, timer)
}

const heartSpriteClass = (slot: number) => {
  if (slot < props.lives) {
    return 'heart-sprite-live'
  }

  if (losingHeartSlots.value.includes(slot)) {
    return 'heart-sprite-lost'
  }

  return 'heart-sprite-hidden'
}

watch(
  () => props.lives,
  (lives, previousLives) => {
    if (previousLives == null || lives >= previousLives) {
      return
    }

    for (let slot = lives; slot < previousLives; slot += 1) {
      triggerLostHeart(slot)
    }
  }
)

onBeforeUnmount(() => {
  for (const timer of losingHeartTimers.values()) {
    clearTimeout(timer)
  }

  losingHeartTimers.clear()
})

defineEmits<{
  skillPointerdown: [event: PointerEvent]
}>()
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 top-12 z-10 px-3">
    <div class="flex items-center justify-between gap-3">
      <div class="flex flex-col leading-none">
        <span class="text-white text-xl font-black">
          Puntos: {{ score }}
        </span>
        <span class="mt-1 text-[0.8rem] font-bold uppercase tracking-[0.12em] text-[#ffd230]">
          Nivel {{ level }}
        </span>
      </div>

      <div class="flex items-center gap-2 px-3 py-2">
        <div
          v-for="slot in heartSlots"
          :key="slot"
          class="heart-sprite"
          :class="heartSpriteClass(slot)"
          :style="heartSpriteStyle"
        />
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

    <div class="absolute right-3 top-36 z-20 -translate-y-1/2 pointer-events-auto">
      <button
        class="ability-button"
        :class="abilityUsesRemaining > 0 ? (isAbilityArming ? 'ability-button-arming' : 'ability-button-ready') : 'ability-button-spent'"
        :disabled="abilityUsesRemaining <= 0"
        @pointerdown.prevent.stop="$emit('skillPointerdown', $event)"
      >
        <img
          :src="abilityImageUrl"
          alt="Insecticida"
          class="ability-button-image drop-shadow-xl"
        >
      </button>
    </div>
</template>
