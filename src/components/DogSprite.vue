<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerEntity } from '@/models/game'

const props = defineProps<{
  player: PlayerEntity
  hitFlash: number
}>()

const furParticles = [
  { x: '18%', y: '48%', dx: '-40px', dy: '-46px', delay: '0ms', size: '10px' },
  { x: '32%', y: '30%', dx: '-18px', dy: '-52px', delay: '18ms', size: '8px' },
  { x: '46%', y: '44%', dx: '8px', dy: '-48px', delay: '0ms', size: '9px' },
  { x: '58%', y: '26%', dx: '34px', dy: '-40px', delay: '12ms', size: '7px' },
  { x: '72%', y: '42%', dx: '46px', dy: '-30px', delay: '24ms', size: '10px' },
  { x: '82%', y: '54%', dx: '34px', dy: '-12px', delay: '8ms', size: '8px' },
  { x: '38%', y: '62%', dx: '-22px', dy: '8px', delay: '16ms', size: '9px' },
  { x: '64%', y: '60%', dx: '24px', dy: '10px', delay: '28ms', size: '8px' }
]

const showFurBurst = computed(() => props.hitFlash > 0)
const showHitShake = computed(() => props.hitFlash > 0)
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
      v-if="showFurBurst"
      class="pointer-events-none absolute inset-0 overflow-visible"
    >
      <span
        v-for="(particle, index) in furParticles"
        :key="index"
        class="dog-fur-particle"
        :style="{
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: `calc(${particle.size} * 0.58)`,
          '--fur-dx': particle.dx,
          '--fur-dy': particle.dy,
          animationDelay: particle.delay
        }"
      />
    </div>

    <div
      class="h-full w-full"
      :class="{ 'dog-hit-shake': showHitShake }"
    >
      <div
        class="dog-idle h-full w-full bg-contain bg-center bg-no-repeat"
        style="background-image: url('images/dog.png')"
      />
    </div>
  </div>
</template>
