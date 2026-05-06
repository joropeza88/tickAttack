import { computed, ref } from 'vue'
import { audioManager } from '@/core/audioManager'

type PreloadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface UsePublicAssetPreloaderOptions {
  enabled: boolean
  imageUrls: readonly string[]
  audioUrls: readonly string[]
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

export function usePublicAssetPreloader(options: UsePublicAssetPreloaderOptions) {
  const status = ref<PreloadStatus>(options.enabled ? 'idle' : 'ready')
  const loadedCount = ref(0)
  const totalCount = options.imageUrls.length + options.audioUrls.length
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

    preloadPromise = (async () => {
      try {
        for (const url of options.imageUrls) {
          await loadImage(url)
          loadedCount.value += 1
        }

        await audioManager.preload(options.audioUrls, (loadedAudioCount) => {
          loadedCount.value = options.imageUrls.length + loadedAudioCount
        })

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
