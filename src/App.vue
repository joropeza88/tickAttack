<script setup lang="ts">
import { ref } from 'vue'
import { loadProgress, updateProgressForCompletedLevel } from '@/core/progressStorage'
import GameView from '@/views/GameView.vue'
import HomeView from '@/views/HomeView.vue'
import LevelSelectView from '@/views/LevelSelectView.vue'
import VictoryView from '@/views/VictoryView.vue'

const currentScreen = ref<'home' | 'level-select' | 'game' | 'victory'>('home')
const selectedLevel = ref(1)
const progress = ref(loadProgress())

const onStart = () => {
  progress.value = loadProgress()

  if (progress.value.highestCompletedLevel <= 0) {
    selectedLevel.value = 1
    currentScreen.value = 'game'
    return
  }

  currentScreen.value = 'level-select'
}

const onLevelSelected = (level: number) => {
  selectedLevel.value = level
  currentScreen.value = 'game'
}

const onLevelCompleted = (level: number) => {
  progress.value = updateProgressForCompletedLevel(level)
}
</script>

<template>
  <div class="min-h-screen">
    <HomeView
      v-if="currentScreen === 'home'"
      @start="onStart"
    />
    <LevelSelectView
      v-else-if="currentScreen === 'level-select'"
      :progress="progress"
      @exit="currentScreen = 'home'"
      @select-level="onLevelSelected"
    />
    <GameView
      v-else-if="currentScreen === 'game'"
      :start-level="selectedLevel"
      @exit="currentScreen = 'home'"
      @level-completed="onLevelCompleted"
      @completed="currentScreen = 'victory'"
    />
    <VictoryView
      v-else
      @exit="currentScreen = 'home'"
    />
  </div>
</template>
