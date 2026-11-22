import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8100',
    viewportWidth: 1280,
    viewportHeight: 800,
    setupNodeEvents() {
      // Event listeners de Cypress
    },
  },
});
