type AudioPlaybackOptions = {
  loop?: boolean
  offsetSeconds?: number
  volume?: number
  stopPrevious?: boolean
}

class AudioManager {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private buffers = new Map<string, AudioBuffer>()
  private activeSources = new Map<string, AudioBufferSourceNode[]>()
  private unlockBound = false

  setupUnlock(): void {
    if (typeof window === 'undefined' || this.unlockBound) {
      return
    }

    this.unlockBound = true
    const unlock = () => {
      void this.resume()
    }

    window.addEventListener('pointerdown', unlock, { once: true, passive: true })
    window.addEventListener('touchstart', unlock, { once: true, passive: true })
  }

  async preload(urls: readonly string[], onLoaded?: (loadedCount: number) => void): Promise<void> {
    let loadedCount = 0

    for (const url of urls) {
      await this.loadBuffer(url)
      loadedCount += 1
      onLoaded?.(loadedCount)
    }
  }

  async play(url: string, options: AudioPlaybackOptions = {}): Promise<void> {
    const context = this.getContext()

    if (context.state === 'suspended') {
      await context.resume()
    }

    const buffer = await this.loadBuffer(url)
    const source = context.createBufferSource()
    const gainNode = context.createGain()

    source.buffer = buffer
    source.loop = options.loop ?? false
    gainNode.gain.value = options.volume ?? 1

    source.connect(gainNode)
    gainNode.connect(this.getMasterGain())

    if (options.stopPrevious) {
      this.stop(url)
    }

    const sources = this.activeSources.get(url) ?? []
    sources.push(source)
    this.activeSources.set(url, sources)

    source.onended = () => {
      const currentSources = this.activeSources.get(url)
      if (!currentSources) {
        return
      }

      const nextSources = currentSources.filter((entry) => entry !== source)
      if (nextSources.length === 0) {
        this.activeSources.delete(url)
      } else {
        this.activeSources.set(url, nextSources)
      }
    }

    const offsetSeconds = Math.max(0, options.offsetSeconds ?? 0)
    source.start(0, Math.min(offsetSeconds, Math.max(0, buffer.duration - 0.01)))
  }

  isPlaying(url: string): boolean {
    return (this.activeSources.get(url)?.length ?? 0) > 0
  }

  stop(url: string): void {
    const sources = this.activeSources.get(url)
    if (!sources) {
      return
    }

    for (const source of sources) {
      source.stop()
    }

    this.activeSources.delete(url)
  }

  stopAll(): void {
    for (const url of this.activeSources.keys()) {
      this.stop(url)
    }
  }

  async resume(): Promise<void> {
    const context = this.getContext()
    if (context.state === 'suspended') {
      await context.resume()
    }
  }

  private async loadBuffer(url: string): Promise<AudioBuffer> {
    const existingBuffer = this.buffers.get(url)
    if (existingBuffer) {
      return existingBuffer
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`No se pudo cargar el audio: ${url}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await this.getContext().decodeAudioData(arrayBuffer)
    this.buffers.set(url, audioBuffer)
    return audioBuffer
  }

  private getContext(): AudioContext {
    if (this.context) {
      return this.context
    }

    const AudioContextCtor = window.AudioContext ?? (window as Window & typeof globalThis & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext
    if (!AudioContextCtor) {
      throw new Error('Web Audio API no está disponible en este navegador.')
    }

    this.context = new AudioContextCtor()
    return this.context
  }

  private getMasterGain(): GainNode {
    if (this.masterGain) {
      return this.masterGain
    }

    const gainNode = this.getContext().createGain()
    gainNode.gain.value = 1
    gainNode.connect(this.getContext().destination)
    this.masterGain = gainNode
    return gainNode
  }
}

export const audioManager = new AudioManager()
