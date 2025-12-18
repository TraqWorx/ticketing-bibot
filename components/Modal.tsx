/**
 * COMPONENT: Modal
 * 
 * Modale riutilizzabile
 * 
 * Features:
 * - Overlay con backdrop
 * - Chiusura con ESC o click fuori
 * - Header con titolo e bottone chiusura
 * - Footer opzionale
 * 
 * Pattern: Reusable presentational component
 */

import { ReactNode, useEffect } from 'react';
import { Box, Heading, IconButton, HStack } from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizeMap = {
  sm: '400px',
  md: '600px',
  lg: '800px',
  xl: '1000px',
};

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  footer 
}: ModalProps) => {
  // Chiudi con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      zIndex="1000"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {/* Backdrop */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="blackAlpha.600"
        onClick={onClose}
      />

      {/* Modal Content */}
      <Box
        position="relative"
        bg="white"
        borderRadius="lg"
        boxShadow="2xl"
        maxW={sizeMap[size]}
        w="90%"
        maxH="90vh"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <HStack
          justify="space-between"
          align="center"
          p={6}
          borderBottomWidth="1px"
          borderColor="gray.200"
        >
          <Heading size="lg">{title}</Heading>
          <IconButton
            aria-label="Chiudi modale"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <FiX size={20} />
          </IconButton>
        </HStack>

        {/* Body */}
        <Box flex="1" overflowY="auto" p={6}>
          {children}
        </Box>

        {/* Footer */}
        {footer && (
          <Box p={6} borderTopWidth="1px" borderColor="gray.200">
            {footer}
          </Box>
        )}
      </Box>
    </Box>
  );
};
