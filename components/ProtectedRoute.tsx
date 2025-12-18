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
  const { user, loading } = useAuth();
  const router = useRouter();

  // Show loading spinner
  if (loading) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="black" />
          <Text color="gray.600">Verifica autenticazione...</Text>
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
