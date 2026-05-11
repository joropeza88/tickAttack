<script setup lang="ts">
import { computed } from 'vue'
import type { EnemyEntity } from '@/models/game'

const props = defineProps<{
  enemy: EnemyEntity
}>()

const enemyClasses = computed(() => ({
  'tick-crushed': props.enemy.state === 'crushed',
  'enemy-hit': props.enemy.state === 'falling' && props.enemy.tapFeedbackTimeLeftMs > 0,
  'flea-leap-active':
    props.enemy.state === 'falling' &&
    props.enemy.type === 'flea' &&
    props.enemy.buffs.leap &&
    props.enemy.leapTimeLeftMs > 0
}))

const enemyVisualClasses = computed(() => ({
  'tick-sprite-sheet': props.enemy.state === 'falling' && props.enemy.type !== 'mother' && props.enemy.type !== 'flea',
  'tick-mother-sprite-sheet': props.enemy.state === 'falling' && props.enemy.type === 'mother',
  'flea-sprite-sheet': props.enemy.state === 'falling' && props.enemy.type === 'flea',
  'enemy-sprite-crushed': props.enemy.state === 'crushed'
}))

const enemyVisualStyle = computed(() => {
  if (props.enemy.state === 'crushed' && props.enemy.type === 'flea') {
    return {
      backgroundImage: 'url(images/flea_sprite.webp)',
      backgroundSize: '500% 100%',
      backgroundPosition: '100% 0'
    }
  }

  if (props.enemy.state === 'crushed' && props.enemy.type === 'mother') {
    return {
      backgroundImage: 'url(images/tick_mother_sprite.webp)',
      backgroundSize: '500% 100%',
      backgroundPosition: '100% 0'
    }
  }

  if (props.enemy.state === 'crushed') {
    return {
      backgroundImage: 'url(images/tick_sprite.webp)',
      backgroundSize: '500% 100%',
      backgroundPosition: '100% 0'
    }
  }

  if (props.enemy.type === 'flea') {
    return {
      backgroundImage: 'url(images/flea_sprite.webp)',
      backgroundSize: '500% 100%',
      '--flea-leap-duration': `${props.enemy.leapDurationMs}ms`
    }
  }

  if (props.enemy.type === 'mother') {
    return {
      backgroundImage: 'url(images/tick_mother_sprite.webp)',
      backgroundSize: '500% 100%'
    }
  }

  return {
    backgroundImage: 'url(images/tick_sprite.webp)',
    backgroundSize: '500% 100%'
  }
})
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
      class="score-pop pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2"
    >
      {{ `x${enemy.scoreValue}` }}
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
