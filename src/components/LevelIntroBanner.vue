<script setup lang="ts">
defineProps<{
  title: string
  eyebrow: string
  variant?: 'warning' | 'level'
}>()
</script>

<template>
  <div
    class="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-6"
    :class="variant === 'warning' ? 'top-[12%]' : 'top-[22%]'"
  >
    <div
      class="level-intro-banner"
      :class="variant === 'warning' ? 'level-intro-warning' : 'level-intro-level'"
    >
      <p class="text-[11px] font-semibold uppercase tracking-[0.36em]">
        {{ eyebrow }}
      </p>
      <p class="mt-2 text-3xl font-black leading-none">
        {{ title }}
      </p>
    </div>
  </div>
</template>
