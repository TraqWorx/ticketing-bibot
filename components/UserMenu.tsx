/**
 * COMPONENT: UserMenu
 * 
 * Menu dropdown utente con logout
 * Features: Avatar con iniziale, nome, email, stato account, menu dropdown con logout
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Text, HStack, VStack, Badge, Separator } from '@chakra-ui/react';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'react-toastify';

export const UserMenu = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Chiudi menu quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // ProtectedRoute gestisce automaticamente il redirect
    } catch (error) {
      toast.error('Errore durante il logout');
    }
  };

  if (!user) {
    return null;
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email || 'Utente';
  
  const firstLetter = user.firstName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Box position="relative" ref={menuRef}>
      <HStack 
        cursor="pointer" 
        px={3} 
        py={2} 
        borderRadius="md"
        _hover={{ bg: 'gray.100' }}
        transition="all 0.2s"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Box
          w={8}
          h={8}
          bg="black"
          color="white"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontWeight="bold"
          fontSize="sm"
        >
          {firstLetter}
        </Box>
        <Box display={{ base: 'none', md: 'block' }}>
          <Text fontSize="sm" fontWeight="medium">{displayName}</Text>
          <Text fontSize="xs" color="gray.600">{user.email}</Text>
        </Box>
      </HStack>

      {/* Dropdown Menu */}
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 8px)"
          right={0}
          bg="white"
          borderRadius="md"
          borderWidth="1px"
          borderColor="gray.200"
          shadow="lg"
          minW="220px"
          py={2}
          zIndex={1000}
        >
          <VStack gap={0} align="stretch">
            {/* Logout */}
            <Box
              px={4}
              py={3}
              cursor="pointer"
              _hover={{ bg: 'red.50' }}
              transition="all 0.2s"
              onClick={handleLogout}
            >
              <HStack gap={3}>
                <Box as={FiLogOut} color="red.500" />
                <Text fontSize="sm" fontWeight="medium" color="red.600">
                  Logout
                </Text>
              </HStack>
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
};
