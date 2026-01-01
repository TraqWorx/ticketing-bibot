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

import { Modal } from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import {
  Box,
  Button,
  Center,
  IconButton,
  Input,
  Link,
  Text,
  VStack
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const LoginPage = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

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
      // Check for redirect URL after login
      const redirectUrl = typeof window !== 'undefined' ? localStorage.getItem('redirectAfterLogin') : null;
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      // Gestione errore silente - solo toast, no console.error
      const errorCode = err.code || 'unknown';
      const errorMessage = getFirebaseErrorMessage(errorCode);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!forgotEmail) {
      toast.error('Inserisci l\'email');
      return;
    }

    setIsForgotLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Errore durante l\'invio dell\'email di recupero password');
        return;
      }

      toast.success('Email e messaggio WhatsApp di recupero password inviati');
      setIsForgotModalOpen(false);
      setForgotEmail('');

    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error('Errore di connessione. Riprova più tardi.');
    } finally {
      setIsForgotLoading(false);
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
        <VStack gap={6} align="stretch">
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
            <VStack gap={4}>
              {/* Email */}
              <Box w="full">
                <Text fontSize="sm" fontWeight="medium" mb={1}>Email</Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Inserisci la tua email"
                  size="lg"
                />
              </Box>

              {/* Password */}
              <Box w="full">
                <Text fontSize="sm" fontWeight="medium" mb={1}>Password</Text>
                <Box position="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    size="lg"
                    pr="12"
                  />
                  <IconButton
                    position="absolute"
                    right="2"
                    top="50%"
                    transform="translateY(-50%)"
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="sm"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </IconButton>
                </Box>
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

              {/* Forgot Password Link */}
              <Text textAlign="center" fontSize="sm">
                <Link 
                  color="blue.500" 
                  onClick={() => setIsForgotModalOpen(true)}
                  cursor="pointer"
                >
                  Password dimenticata?
                </Link>
              </Text>
            </VStack>
          </form>
        </VStack>
      </Box>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Recupera Password"
      >
        <VStack gap={4} align="stretch">
          <Text>
            Inserisci la tua email e ti invieremo un link per reimpostare la password.
          </Text>
          <form onSubmit={handleForgotPassword}>
            <VStack gap={4}>
              <Box w="full">
                <Text fontSize="sm" fontWeight="medium" mb={1}>Email</Text>
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="tua@email.com"
                  size="lg"
                />
              </Box>
              <Button
                type="submit"
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                size="lg"
                w="full"
                disabled={isForgotLoading}
              >
                {isForgotLoading ? 'Invio in corso...' : 'Recupera Password'}
              </Button>
            </VStack>
          </form>
        </VStack>
      </Modal>
    </Center>
  );
};
