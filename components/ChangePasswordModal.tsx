/**
 * COMPONENT: ChangePasswordModal
 * 
 * Modal per cambiare la password dell'utente
 * Features: Riautenticazione sicura, validazione password, feedback errori
 */

import { useState, useEffect } from 'react';
import {
  Button,
  VStack,
  Input,
  Text,
  Field,
  Box,
  IconButton,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { auth } from '@/config/firebase';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { Modal } from './Modal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Reset form quando si apre la modale
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Password attuale obbligatoria';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Nuova password obbligatoria';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'La password deve essere di almeno 6 caratteri';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Conferma password obbligatoria';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'La nuova password deve essere diversa da quella attuale';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error('Utente non autenticato');
      return;
    }

    setIsLoading(true);

    try {
      // STEP 1: Riautentica l'utente con la password attuale
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      try {
        await reauthenticateWithCredential(user, credential);
      } catch (reAuthError: any) {
        // Cattura errore di riautenticazione
        if (reAuthError.code === 'auth/invalid-credential' || 
            reAuthError.code === 'auth/wrong-password' ||
            reAuthError.code === 'auth/invalid-login-credentials') {
          setErrors({ currentPassword: 'Password attuale non corretta' });
          toast.error('Password attuale non corretta');
          return; // Esce subito senza continuare
        }
        throw reAuthError; // Rilancia altri errori
      }

      // STEP 2: Aggiorna la password (solo se riautenticazione ok)
      await updatePassword(user, newPassword);

      toast.success('Password cambiata con successo');
      
      // Reset form e chiudi modal SOLO se successo
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Gestisci altri errori
      if (error.code === 'auth/weak-password') {
        setErrors({ newPassword: 'La password è troppo debole' });
        toast.error('La password è troppo debole');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Per motivi di sicurezza, devi effettuare nuovamente il login');
      } else {
        toast.error(error.message || 'Errore durante il cambio password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Cambia Password"
      size="md"
      footer={
        <VStack w="full" gap={2}>
          <Button 
            w="full" 
            onClick={handleSubmit} 
            loading={isLoading}
            disabled={isLoading}
          >
            Cambia Password
          </Button>
          <Button 
            w="full" 
            variant="ghost" 
            onClick={handleClose} 
            disabled={isLoading}
          >
            Annulla
          </Button>
        </VStack>
      }
    >
      <VStack gap={4} align="stretch">
        <Text fontSize="sm" color="gray.600">
          Per motivi di sicurezza, devi inserire la password attuale prima di cambiarla.
        </Text>

        <Field.Root invalid={!!errors.currentPassword}>
          <Field.Label fontSize="sm">Password Attuale</Field.Label>
          <Box position="relative" w="full">
            <Input
              w="full"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setErrors({ ...errors, currentPassword: undefined });
              }}
              placeholder="Inserisci password attuale"
              disabled={isLoading}
              pr="12"
            />
            <IconButton
              position="absolute"
              right="2"
              top="50%"
              transform="translateY(-50%)"
              aria-label={showCurrentPassword ? 'Nascondi password' : 'Mostra password'}
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
            </IconButton>
          </Box>
          {errors.currentPassword && (
            <Field.ErrorText>{errors.currentPassword}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={!!errors.newPassword}>
          <Field.Label fontSize="sm">Nuova Password</Field.Label>
          <Box position="relative" w="full">
            <Input
              w="full"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors({ ...errors, newPassword: undefined });
              }}
              placeholder="Inserisci nuova password (min. 6 caratteri)"
              disabled={isLoading}
              pr="12"
            />
            <IconButton
              position="absolute"
              right="2"
              top="50%"
              transform="translateY(-50%)"
              aria-label={showNewPassword ? 'Nascondi password' : 'Mostra password'}
              onClick={() => setShowNewPassword(!showNewPassword)}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              {showNewPassword ? <FiEyeOff /> : <FiEye />}
            </IconButton>
          </Box>
          {errors.newPassword && (
            <Field.ErrorText>{errors.newPassword}</Field.ErrorText>
          )}
        </Field.Root>

        <Field.Root invalid={!!errors.confirmPassword}>
          <Field.Label fontSize="sm">Conferma Nuova Password</Field.Label>
          <Box position="relative" w="full">
            <Input
              w="full"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({ ...errors, confirmPassword: undefined });
              }}
              placeholder="Conferma nuova password"
              disabled={isLoading}
              pr="12"
            />
            <IconButton
              position="absolute"
              right="2"
              top="50%"
              transform="translateY(-50%)"
              aria-label={showConfirmPassword ? 'Nascondi password' : 'Mostra password'}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </IconButton>
          </Box>
          {errors.confirmPassword && (
            <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
          )}
        </Field.Root>
      </VStack>
    </Modal>
  );
};
