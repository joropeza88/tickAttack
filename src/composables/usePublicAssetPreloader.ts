import { computed, ref } from 'vue'

type PreloadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface UsePublicAssetPreloaderOptions {
  enabled: boolean
  imageUrls: readonly string[]
  audioElements: Array<HTMLAudioElement | null>
}

const loadImage = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve()
    image.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`))
    image.src = src

    if (image.complete) {
      resolve()
    }
  })

const loadAudio = (audio: HTMLAudioElement) =>
  new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup()
      resolve()
    }

    const onError = () => {
      cleanup()
      reject(new Error(`No se pudo cargar el audio: ${audio.src}`))
    }

    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('error', onError)
    }

    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      resolve()
      return
    }

    audio.addEventListener('canplaythrough', onReady, { once: true })
    audio.addEventListener('error', onError, { once: true })
    audio.load()
  })

export function usePublicAssetPreloader(options: UsePublicAssetPreloaderOptions) {
  const status = ref<PreloadStatus>(options.enabled ? 'idle' : 'ready')
  const loadedCount = ref(0)
  const totalCount = options.imageUrls.length + options.audioElements.filter(Boolean).length
  const errorMessage = ref('')
  let preloadPromise: Promise<void> | null = null

  const progress = computed(() => {
    if (totalCount === 0) {
      return 100
    }

    return Math.round((loadedCount.value / totalCount) * 100)
  })

  const preload = async () => {
    if (!options.enabled || status.value === 'ready') {
      return
    }

    if (preloadPromise) {
      return preloadPromise
    }

    loadedCount.value = 0
    errorMessage.value = ''
    status.value = 'loading'

    const tasks = [
      ...options.imageUrls.map((url) => () => loadImage(url)),
      ...options.audioElements.filter((audio): audio is HTMLAudioElement => audio != null).map((audio) => () => loadAudio(audio))
    ]

    preloadPromise = (async () => {
      try {
        for (const task of tasks) {
          await task()
          loadedCount.value += 1
        }

        status.value = 'ready'
      } catch (error) {
        status.value = 'error'
        errorMessage.value = error instanceof Error ? error.message : 'No se pudieron precargar los recursos.'
        throw error
      } finally {
        preloadPromise = null
      }
    })()

    return preloadPromise
  }

  return {
    errorMessage,
    isEnabled: options.enabled,
    isLoading: computed(() => status.value === 'loading'),
    isReady: computed(() => status.value === 'ready'),
    progress,
    status,
    totalCount,
    preload
  }
}
