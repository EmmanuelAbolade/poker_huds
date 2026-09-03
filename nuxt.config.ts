// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxt/ui'],
  // Registering the stylesheet here (rather than only importing it from
  // app.vue) is the documented way to get Nuxt UI's Tailwind layer processed.
  css: ['~/assets/css/main.css']
})