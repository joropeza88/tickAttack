import { createApp } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import { audioManager } from '@/core/audioManager'
import App from './App.vue'
import './assets/main.css'

registerSW({ immediate: true })
audioManager.setupUnlock()

createApp(App).mount('#app')
