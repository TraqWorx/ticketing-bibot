/**
 * COMPONENT: SessionExpiredModal
 *
 * Modale che appare quando la sessione è scaduta (401)
 * Permette all'utente di confermare il logout e tornare al login
 */

import { Button, Text, VStack, Icon } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';
import { Modal } from '@/components/Modal';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SessionExpiredModal = ({ isOpen, onClose, onConfirm }: SessionExpiredModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      closable={false}
      footer={
        <Button
          colorScheme="red"
          onClick={onConfirm}
          width="full"
        >
          Vai al Login
        </Button>
      }
    >
      <VStack gap={4} textAlign="center">
        <Icon as={FiAlertTriangle} color="red.500" boxSize={12} />
        <Text fontSize="lg" fontWeight="bold" color="red.500">
          Sessione Scaduta
        </Text>
        <Text>
          La tua sessione è scaduta. Effettua nuovamente il login.
        </Text>
        <Text fontSize="sm" color="gray.600">
          Verrai reindirizzato alla pagina di login.
        </Text>
      </VStack>
    </Modal>
  );
};

// Funzione globale per mostrare la modale di sessione scaduta
// Questa può essere chiamata dall'interceptor axios
let showSessionExpiredModal: (() => void) | null = null;

export const setSessionExpiredModalHandler = (handler: () => void) => {
  showSessionExpiredModal = handler;
};

export const triggerSessionExpiredModal = () => {
  if (showSessionExpiredModal) {
    showSessionExpiredModal();
  }
};