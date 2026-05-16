<script setup lang="ts">
import { useButtonPressAction } from '@/composables/useButtonPressAction'
import { publicAssetUrl } from '@/utils/publicAssetUrl'

const emit = defineEmits<{
  action: []
}>()

const { isPressing, runPressAction } = useButtonPressAction()
const exitIconUrl = publicAssetUrl('images/out.webp')

const onAction = () => {
  runPressAction(() => emit('action'))
}
</script>

<template>
  <button
    class="absolute left-2 bottom-6 z-20 rounded-full bg-white p-3 transition hover:scale-[1.02] disabled:cursor-wait disabled:opacity-70 disabled:hover:scale-100"
    :class="{ 'button-press-pop': isPressing }"
    @click="onAction"
  >
    <img :src="exitIconUrl" class="h-6 w-6">
  </button>
</template>
