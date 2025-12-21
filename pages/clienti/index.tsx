/**
 * ROUTE: /client
 * 
 * Root CLIENT - Redirect automatico a ticketing
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';

export default function ClientRoot() {
  const router = useRouter();

  useEffect(() => {
    router.push('/clienti/ticketing');
  }, [router]);

  return (
    <Center h="100vh" bg="gray.50">
      <VStack gap={4}>
        <Spinner size="xl" color="black" />
        <Text color="gray.600">Reindirizzamento...</Text>
      </VStack>
    </Center>
  );
}
