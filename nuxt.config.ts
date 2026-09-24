export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  runtimeConfig: {
    // Vercel/runtime: NUXT_TREK_PIN. Local .env may use TREK_PIN or NUXT_TREK_PIN.
    trekPin: process.env.NUXT_TREK_PIN || process.env.TREK_PIN || ''
  },
  css: ['~/assets/scss/main.scss'],
  app: {
    head: {
      title: 'Trek Checklist',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#101114' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ]
    }
  }
})
