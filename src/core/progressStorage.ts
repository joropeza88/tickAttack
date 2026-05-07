import { GAME_CONFIG } from '@/core/config'

export interface GameProgress {
  highestUnlockedLevel: number
  highestCompletedLevel: number
}

const STORAGE_KEY = 'tick-attack-progress'

const clampLevel = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(
    GAME_CONFIG.progression.victoryLevel,
    Math.max(1, Math.floor(value))
  )
}

const sanitizeProgress = (value: unknown): GameProgress => {
  if (!value || typeof value !== 'object') {
    return { highestUnlockedLevel: 1, highestCompletedLevel: 0 }
  }

  const candidate = value as Partial<GameProgress>
  const highestUnlockedLevel = clampLevel(candidate.highestUnlockedLevel ?? 1)
  const highestCompletedLevel = Math.min(
    highestUnlockedLevel,
    Math.max(0, Math.floor(candidate.highestCompletedLevel ?? 0))
  )

  return {
    highestUnlockedLevel,
    highestCompletedLevel
  }
}

export const loadProgress = (): GameProgress => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { highestUnlockedLevel: 1, highestCompletedLevel: 0 }
    }

    return sanitizeProgress(JSON.parse(raw))
  } catch {
    return { highestUnlockedLevel: 1, highestCompletedLevel: 0 }
  }
}

export const saveProgress = (progress: GameProgress): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeProgress(progress)))
}

export const updateProgressForCompletedLevel = (completedLevel: number): GameProgress => {
  const currentProgress = loadProgress()
  const normalizedCompletedLevel = clampLevel(completedLevel)
  const nextUnlockedLevel = Math.min(
    GAME_CONFIG.progression.victoryLevel,
    normalizedCompletedLevel + 1
  )

  const nextProgress: GameProgress = {
    highestCompletedLevel: Math.max(currentProgress.highestCompletedLevel, normalizedCompletedLevel),
    highestUnlockedLevel: Math.max(currentProgress.highestUnlockedLevel, nextUnlockedLevel)
  }

  saveProgress(nextProgress)
  return nextProgress
}
