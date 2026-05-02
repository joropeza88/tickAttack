import { onBeforeUnmount, ref } from 'vue'

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
  const buttonSound = typeof Audio !== 'undefined' ? new Audio(audioUrl) : null
  let resetPressTimer = 0
  let actionTimer = 0

  if (buttonSound) {
    buttonSound.preload = 'auto'
  }

  const clearTimers = () => {
    window.clearTimeout(resetPressTimer)
    window.clearTimeout(actionTimer)
  }

  const runPressAction = (action: () => void) => {
    clearTimers()
    isPressing.value = true

    if (buttonSound) {
      buttonSound.currentTime = audioOffsetSeconds
      void buttonSound.play().catch(() => {})
    }

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
