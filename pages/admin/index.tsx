/**
 * ROUTE: /admin
 * 
 * Root ADMIN - Redirect automatico a gestione utenti
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';

export default function AdminRoot() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/users');
  }, [router]);

  return (
    <Center h="100vh" bg="gray.50">
      <VStack gap={4}>
        <Spinner size="xl" color="brand.500" />
        <Text color="gray.600">Reindirizzamento...</Text>
      </VStack>
    </Center>
  );
}
