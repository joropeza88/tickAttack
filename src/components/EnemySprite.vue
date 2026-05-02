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
  'tick-crushed': props.enemy.state === 'crushed',
  'enemy-hit': props.enemy.state === 'falling' && props.enemy.tapFeedbackTimeLeftMs > 0
}))

const enemyVisualClasses = computed(() => ({
  'tick-sprite-sheet': props.enemy.state === 'falling' && props.enemy.type !== 'mother',
  'tick-mother-sprite-sheet': props.enemy.state === 'falling' && props.enemy.type === 'mother'
}))

const enemyVisualStyle = computed(() => {
  if (props.enemy.state === 'falling' && props.enemy.type === 'mother') {
    return {
      backgroundImage: 'url(images/tick_mother_sprite.png)',
      backgroundSize: '400% 100%'
    }
  }

  if (props.enemy.state === 'falling' && props.enemy.type !== 'mother') {
    return {
      backgroundImage: 'url(images/tick_sprite.png)',
      backgroundSize: '400% 100%'
    }
  }

  return {
    backgroundImage: enemyImage.value,
    backgroundSize: 'cover'
  }
})

const showPartialSplat = computed(
  () =>
    props.enemy.state === 'falling' &&
    props.enemy.tapFeedbackTimeLeftMs > 0 &&
    props.enemy.tapsRequired > 1 &&
    props.enemy.tapsTaken > 0
)
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
      v-if="enemy.state === 'crushed'"
      class="score-pop pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 text-border"
    >
      {{ `x${enemy.scoreValue}` }}
    </div>

    <div
      v-else-if="showPartialSplat"
      class="absolute inset-0 -z-10"
    >
      <div class="enemy-splat enemy-splat-soft absolute left-1/2 top-[60%]" />
    </div>

    <div
      class="h-full w-full drop-shadow-xl"
      :class="enemyClasses"
    >
      <div
        class="h-full w-full bg-no-repeat"
        :class="enemyVisualClasses"
        :style="enemyVisualStyle"
      />
    </div>
  </div>
</template>
