/**
 * MODULE: Settings
 * 
 * Pagina settings del sistema
 */

import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import DelegatesSection from './delegati';

export default function SettingsPage() {
  return (
    <Box minH="100vh" p={{ base: 6, md: 10 }}>
      <VStack gap={8} align="stretch" maxW="1400px" mx="auto">
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" fontWeight="700" color="gray.900">
              Impostazioni
            </Heading>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Configurazioni generali dell'applicazione
            </Text>
          </Box>
        </Flex>

        {/* Delegates Section */}
        <Box>
          <DelegatesSection />
        </Box>
      </VStack>
    </Box>
  );
}
