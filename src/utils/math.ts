export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}
