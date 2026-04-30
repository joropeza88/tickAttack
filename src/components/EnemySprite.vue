<script setup lang="ts">
import { computed } from 'vue'
import type { EnemyEntity } from '@/models/game'

const props = defineProps<{
  enemy: EnemyEntity
}>()

const enemyImage = computed(() => {
  if (props.enemy.state === 'crushed') {
    return 'url(images/tick_crushed.png)'
  }

  return props.enemy.type === 'mother' ? 'url(images/mother_tick.png)' : 'url(images/tick.png)'
})

const enemyClasses = computed(() => ({
  walk: props.enemy.state === 'falling' && props.enemy.tapFeedbackTimeLeftMs <= 0,
  'tick-crushed': props.enemy.state === 'crushed',
  'enemy-hit': props.enemy.state === 'falling' && props.enemy.tapFeedbackTimeLeftMs > 0
}))
</script>

<template>
  <div
    class="absolute"
    :style="{
      width: `${enemy.size.width}px`,
      height: `${enemy.size.height}px`,
      transform: `translate3d(${enemy.position.x}px, ${enemy.position.y}px, 0)`,
      willChange: 'transform'
    }"
  >
    <div
      v-if="enemy.state === 'crushed'"
      class="absolute inset-0 -z-10"
    >
      <div class="enemy-splat absolute left-1/2 top-[60%]" />
    </div>

    <div
      class="h-full w-full drop-shadow-md"
      :class="enemyClasses"
      :style="{
        backgroundImage: enemyImage,
        backgroundSize: 'cover'
      }"
    />
  </div>
</template>
