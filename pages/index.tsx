/**
 * ROUTE: Root / Home
 * 
 * Landing page con redirect basato su ruolo
 * 
 * Logic:
 * - ADMIN → /admin/users
 * - CLIENT → /clienti/ticketing
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect basato su ruolo
      if (user.role === UserRole.ADMIN) {
        router.push('/admin/users');
      } else if (user.role === UserRole.CLIENT) {
        router.push('/clienti/ticketing');
      }
    }
  }, [user, loading, router]);

  return (
    <Center h="100vh" bg="gray.50">
      <VStack gap={4}>
        <Spinner size="xl" color="brand.500" />
        <Text color="gray.600">Reindirizzamento in corso...</Text>
      </VStack>
    </Center>
  );
}
