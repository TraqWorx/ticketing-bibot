/**
 * SHARED: Chakra UI Theme
 * 
 * Tema custom per design system enterprise
 * Pattern: Centralizzare stili per consistenza UI attraverso tutti i moduli
 * 
 * Design: Brand colors derivati dal logo Bibot (viola + ciano)
 * Palette: Scala di viola con accenti ciano per design moderno e distintivo
 *
 * Chakra UI v3: Usa createSystem invece di extendTheme
 */

import { createSystem, defaultConfig } from '@chakra-ui/react';

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#F4EAFF' },   // Lilla pallido
          100: { value: '#E2C9FF' },  // Lilla chiaro
          200: { value: '#C49BFF' },  // Viola chiaro
          300: { value: '#9D63FF' },  // Viola medio
          400: { value: '#6B25E5' },  // Viola medio-scuro
          500: { value: '#3D00B5' },  // VIOLA - Colore principale (logo)
          600: { value: '#350099' },  // Viola scuro
          700: { value: '#2C0080' },  // Viola molto scuro
          800: { value: '#220066' },  // Viola profondo
          900: { value: '#19004D' },  // Viola quasi nero
        },
        accent: {
          50: { value: '#EAFFFF' },
          100: { value: '#C4FAFA' },
          200: { value: '#A0F1F1' },  // CIANO chiaro (logo "Bi")
          300: { value: '#7CE6E6' },
          400: { value: '#5BD8D8' },
          500: { value: '#3DC5C5' },
          600: { value: '#28A8A8' },
          700: { value: '#1F8585' },
          800: { value: '#176262' },
          900: { value: '#0F4040' },
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
