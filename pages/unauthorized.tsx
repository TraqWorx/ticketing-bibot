/**
 * ROUTE: /unauthorized
 * 
 * Pagina accesso negato
 * Mostrata quando l'utente tenta di accedere a una risorsa non autorizzata
 */

import { Box, Heading, Text, Button, VStack, Center } from '@chakra-ui/react';
import { useRouter } from 'next/router';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <Center h="100vh" bg="gray.50">
      <VStack spacing={6} textAlign="center" maxW="md" p={8}>
        <Box fontSize="6xl">🚫</Box>
        <Heading size="xl">Accesso Negato</Heading>
        <Text color="gray.600">
          Non hai i permessi necessari per accedere a questa pagina.
        </Text>
        <Button
          bg="black"
          color="white"
          _hover={{ bg: 'gray.800' }}
          onClick={() => router.push('/')}
        >
          Torna alla Home
        </Button>
      </VStack>
    </Center>
  );
}
