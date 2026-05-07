<script setup lang="ts">
import GameViewport from '@/components/GameViewport.vue'

defineProps<{
  startLevel: number
}>()

defineEmits<{
  exit: []
  completed: []
  levelCompleted: [level: number]
}>()
</script>

<template>
  <GameViewport
    :start-level="startLevel"
    @exit="$emit('exit')"
    @completed="$emit('completed')"
    @level-completed="$emit('levelCompleted', $event)"
  />
</template>
