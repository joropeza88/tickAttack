import { onBeforeUnmount, ref } from 'vue'
import { audioManager } from '@/core/audioManager'

interface UseButtonPressActionOptions {
  audioUrl?: string
  audioOffsetSeconds?: number
  actionDelayMs?: number
}

export function useButtonPressAction(options: UseButtonPressActionOptions = {}) {
  const {
    audioUrl = 'sounds/button-press.mp3',
    audioOffsetSeconds = 0.2,
    actionDelayMs = 160
  } = options

  const isPressing = ref(false)
  let resetPressTimer = 0
  let actionTimer = 0

  const clearTimers = () => {
    window.clearTimeout(resetPressTimer)
    window.clearTimeout(actionTimer)
  }

  const runPressAction = (action: () => void) => {
    clearTimers()
    isPressing.value = true

    void audioManager.play(audioUrl, { offsetSeconds: audioOffsetSeconds, volume: 1 })

    resetPressTimer = window.setTimeout(() => {
      isPressing.value = false
    }, 110)

    actionTimer = window.setTimeout(() => {
      action()
    }, actionDelayMs)
  }

  onBeforeUnmount(() => {
    clearTimers()
  })

  return {
    isPressing,
    runPressAction
  }
}
