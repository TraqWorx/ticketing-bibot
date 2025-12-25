/**
 * COMPONENT: ProtectedRoute
 * 
 * Wrapper per proteggere routes da accessi non autorizzati
 * 
 * Features:
 * - Blocca accesso se non autenticato
 * - Mostra loading durante verifica auth
 * - Redirect automatico a login
 * 
 * Pattern: HOC (Higher Order Component)
 */

import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './LoginPage';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isLoggingOut } = useAuth();
  const router = useRouter();

  // Allow access to reset-password page without authentication
  if (router.pathname === '/reset-password') {
    return <>{children}</>;
  }

  // Show loading spinner during auth check or logout
  if (loading || isLoggingOut) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack gap={4}>
          <Spinner size="xl" color="black" />
          <Text color="gray.600">
            {isLoggingOut ? 'Disconnessione in corso...' : 'Verifica autenticazione...'}
          </Text>
        </VStack>
      </Center>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // User is authenticated, show content
  return <>{children}</>;
};
