<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerEntity } from '@/models/game'

const props = defineProps<{
  player: PlayerEntity
  hitFlash: number
  hitCount: number
}>()

const isHitActive = computed(() => props.hitFlash > 0)
const dogSpriteClass = computed(() => isHitActive.value ? 'dog-sprite-shake' : 'dog-sprite-default')
const dogSpriteStyle = computed(() => ({
  backgroundImage: `url('images/${isHitActive.value ? 'dog_sprite_shake.webp' : 'dog_sprite.webp'}')`
}))
</script>

<template>
  <div
    class="absolute"
    :style="{
      width: `${player.size.width}px`,
      height: `${player.size.height}px`,
      transform: `translate3d(${player.position.x}px, ${player.position.y}px, 0)`,
      willChange: 'transform'
    }"
  >
    <div
      :key="`dog-${hitCount}-${isHitActive ? 'hit' : 'idle'}`"
      class="h-full w-full drop-shadow-xl"
      :class="dogSpriteClass"
      :style="dogSpriteStyle"
    />
  </div>
</template>
