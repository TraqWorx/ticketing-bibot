/**
 * MODULE: Admin - User Management Page
 * 
 * Pagina principale gestione utenti CLIENT
 * 
 * Features:
 * - Creazione nuovo utente
 * - Lista utenti con azioni
 * - Toggle stato utente
 * 
 * Architettura:
 * - Composizione di componenti piccoli
 * - Service layer per logica business
 * - UI presentation only in components
 */

import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  HStack,
  VStack,
  Text,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Modal } from '@/components/Modal';
import { CreateUserForm } from '../components/CreateUserForm';
import { UsersTable } from '../components/UsersTable';
import { createClientUser, getClientUsers, deleteUser } from '@/services/users.service';
import { User, CreateUserInput } from '@/types/user';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; clientName: string } | null>(null);

  // Carica lista utenti
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getClientUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error(error.message || 'Errore nel caricamento dei clienti');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creazione utente
  const handleCreateUser = async (data: CreateUserInput) => {
    try {
      const { user, message } = await createClientUser(data);
      
      toast.success(
        `✅ ${message}\nClient ID: ${user.client_id}\nEmail: ${user.email}`,
        { autoClose: 8000 }
      );
      setIsModalOpen(false);
      
      // Ricarica lista
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la creazione del cliente');
    }
  };

  // Handle eliminazione utente - apre modale conferma
  const handleDeleteUser = (userId: string, clientName: string) => {
    setDeleteConfirm({ userId, clientName });
  };

  // Conferma eliminazione
  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteUser(deleteConfirm.userId);
      toast.success('Cliente eliminato definitivamente');
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'eliminazione');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Box>
        <HStack justify="space-between" mb={2}>
          <Heading size="xl">Gestione Clienti</Heading>
          <Button
            leftIcon={<FiPlus />}
            bg="black"
            color="white"
            _hover={{ bg: 'gray.800' }}
            onClick={() => setIsModalOpen(true)}
          >
            Nuovo Cliente
          </Button>
        </HStack>
      </Box>

      {/* Create User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Aggiungi Nuovo Cliente"
        size="lg"
      >
        <CreateUserForm
          onSubmit={handleCreateUser}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="⚠️ Conferma Eliminazione"
        size="md"
      >
        <VStack spacing={4} align="stretch">
          <Box bg="red.50" p={4} borderRadius="md" borderLeftWidth="4px" borderLeftColor="red.500">
            <Text fontWeight="bold" color="red.700" mb={2}>
              ATTENZIONE: Operazione irreversibile
            </Text>
            <Text fontSize="sm" color="gray.700" mb={3}>
              Stai per eliminare definitivamente il cliente <strong>"{deleteConfirm?.clientName}"</strong>.
            </Text>
            <VStack align="start" spacing={1} fontSize="sm" color="gray.700">
              <Text>• Eliminazione account Firebase</Text>
              <Text>• Eliminazione dati Firestore</Text>
              <Text>• Perdita di tutti i dati associati</Text>
            </VStack>
          </Box>

          <HStack spacing={3} justify="flex-end" pt={2}>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Annulla
            </Button>
            <Button
              bg="red.500"
              color="white"
              _hover={{ bg: 'red.600' }}
              onClick={confirmDelete}
            >
              Elimina Definitivamente
            </Button>
          </HStack>
        </VStack>
      </Modal>

      {/* Users Table */}
      <Box>
        <Heading size="md" mb={4}>Lista Clienti</Heading>
        {isLoading ? (
          <Box p={8} textAlign="center">Caricamento...</Box>
        ) : (
          <UsersTable
            users={users}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </Box>
    </VStack>
  );
}
