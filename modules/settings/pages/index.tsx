/**
 * MODULE: Settings
 * 
 * Pagina settings del sistema
 */

import { Box, Heading, Text } from '@chakra-ui/react';

export default function SettingsPage() {
  return (
    <Box>
      <Heading mb={6}>Impostazioni</Heading>
      <Text color="gray.600">
        Modulo Settings - Configurazioni globali dell'applicazione
      </Text>
    </Box>
  );
}
