<script setup lang="ts">
import { computed } from 'vue'
import type { EnemyEntity } from '@/models/game'

const props = defineProps<{
  enemy: EnemyEntity
}>()

const enemyImage = computed(() => {
  if (props.enemy.state === 'crushed') {
    if (props.enemy.type === 'flea') {
      return 'url(images/flea_crushed.webp)'
    }

    return 'url(images/tick_crushed.webp)'
  }

  return props.enemy.type === 'mother' ? 'url(images/tick_mother_sprite.webp)' : 'url(images/tick_sprite.webp)'
})

const enemyClasses = computed(() => ({
  'tick-crushed': props.enemy.state === 'crushed',
  'enemy-hit': props.enemy.state === 'falling' && props.enemy.tapFeedbackTimeLeftMs > 0
}))

const enemyVisualClasses = computed(() => ({
  'tick-sprite-sheet': props.enemy.state === 'falling' && props.enemy.type !== 'mother' && props.enemy.type !== 'flea',
  'tick-mother-sprite-sheet': props.enemy.state === 'falling' && props.enemy.type === 'mother',
  'flea-sprite-sheet': props.enemy.state === 'falling' && props.enemy.type === 'flea',
  'flea-leap-active':
    props.enemy.state === 'falling' &&
    props.enemy.type === 'flea' &&
    props.enemy.buffs.leap &&
    props.enemy.leapTimeLeftMs > 0
}))

const enemyVisualStyle = computed(() => {
  if (props.enemy.state === 'falling' && props.enemy.type === 'flea') {
    return {
      backgroundImage: 'url(images/flea_sprite.webp)',
      backgroundSize: '400% 100%',
      '--flea-leap-duration': `${props.enemy.leapDurationMs}ms`
    }
  }

  if (props.enemy.state === 'falling' && props.enemy.type === 'mother') {
    return {
      backgroundImage: 'url(images/tick_mother_sprite.webp)',
      backgroundSize: '400% 100%'
    }
  }

  if (props.enemy.state === 'falling' && props.enemy.type !== 'mother') {
    return {
      backgroundImage: 'url(images/tick_sprite.webp)',
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
      <img
        src="/images/stain.webp"
        alt=""
        class="absolute left-1/2 top-[60%] w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-50 select-none pointer-events-none"
      >
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
      <img
        src="/images/stain.webp"
        alt=""
        class="absolute left-1/2 top-[60%] w-[96%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-25 select-none pointer-events-none"
      >
    </div>

    <div
      class="h-full w-full"
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
