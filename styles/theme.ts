/**
 * SHARED: Chakra UI Theme
 * 
 * Tema custom per design system enterprise
 * Pattern: Centralizzare stili per consistenza UI attraverso tutti i moduli
 * 
 * Design: Brand color NERO per allineamento con logo aziendale
 * Palette: Scala di grigi dal nero al bianco per design minimale e professionale
 * 
 * Chakra UI v3: Usa createSystem invece di extendTheme
 */

import { createSystem, defaultConfig } from '@chakra-ui/react';

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#f7f7f7' },   // Quasi bianco
          100: { value: '#e3e3e3' },  // Grigio chiaro
          200: { value: '#c8c8c8' },  // Grigio medio-chiaro
          300: { value: '#a0a0a0' },  // Grigio medio
          400: { value: '#717171' },  // Grigio medio-scuro
          500: { value: '#000000' },  // NERO - Colore principale
          600: { value: '#000000' },  // NERO
          700: { value: '#000000' },  // NERO
          800: { value: '#000000' },  // NERO
          900: { value: '#000000' },  // NERO
        },
      },
      fonts: {
        heading: { value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
        body: { value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
      },
    },
  },
  globalCss: {
    'html, body': {
      bg: 'gray.50',
      color: 'gray.800',
    },
  },
});
