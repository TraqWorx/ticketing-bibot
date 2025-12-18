/**
 * COMPONENT: LoginPage
 * 
 * Schermata di login
 * 
 * Features:
 * - Form email/password
 * - Validazione campi
 * - Error handling
 * - Redirect automatico dopo login
 * 
 * Pattern: Presentational + Firebase Auth
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  Text,
  Center,
} from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';

export const LoginPage = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fade-in animation per evitare glitch
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validazione base
    if (!email || !password) {
      toast.error('Inserisci email e password');
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);
      // Redirect esplicito alla homepage
      router.push('/');
    } catch (err: any) {
      // Gestione errore silente - solo toast, no console.error
      const errorCode = err.code || 'unknown';
      const errorMessage = getFirebaseErrorMessage(errorCode);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center h="100vh" bg="gray.50">
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        w="full"
        maxW="400px"
        opacity={isVisible ? 1 : 0}
        transform={isVisible ? 'scale(1)' : 'scale(0.95)'}
        transition="all 0.3s ease-out"
      >
        <VStack spacing={6} align="stretch">
          {/* Logo / Header */}
          <Box textAlign="center">
            <img 
              src="/logo.svg" 
              alt="Blanco Studio" 
              style={{ height: '150px', margin: '0 auto' }} 
            />
          </Box>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {/* Email */}
              <Box w="full">
                <Text fontSize="sm" fontWeight="medium" mb={1}>Email</Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  size="lg"
                />
              </Box>

              {/* Password */}
              <Box w="full">
                <Text fontSize="sm" fontWeight="medium" mb={1}>Password</Text>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  size="lg"
                />
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                size="lg"
                w="full"
                disabled={isLoading}
              >
                {isLoading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Center>
  );
};
