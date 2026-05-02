<script setup lang="ts">
import GameViewport from '@/components/GameViewport.vue'

defineEmits<{
  exit: []
  completed: []
}>()
</script>

<template>
  <GameViewport
    @exit="$emit('exit')"
    @completed="$emit('completed')"
  />
</template>
