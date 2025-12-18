/**
 * COMPONENT: RoleGuard
 * 
 * Protegge route in base al ruolo utente
 * 
 * Features:
 * - Verifica ruolo utente
 * - Redirect se ruolo non autorizzato
 * - Supporto multi-ruolo
 * 
 * Pattern: Authorization Guard
 */

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const hasAccess = allowedRoles.includes(user.role);

      if (!hasAccess) {
        // Redirect in base al ruolo reale
        if (user.role === UserRole.ADMIN) {
          router.push('/admin/users');
        } else if (user.role === UserRole.CLIENT) {
          router.push('/client/ticketing');
        } else {
          router.push('/unauthorized');
        }
      }
    }
  }, [user, loading, allowedRoles, router]);

  // Loading state
  if (loading) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="black" />
          <Text color="gray.600">Verifica permessi...</Text>
        </VStack>
      </Center>
    );
  }

  // Check authorization
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="black" />
          <Text color="gray.600">Reindirizzamento...</Text>
        </VStack>
      </Center>
    );
  }

  return <>{children}</>;
};
