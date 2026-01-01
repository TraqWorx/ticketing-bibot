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
  Input,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Modal } from '@/components/Modal';
import { CreateUserForm } from '../components/CreateUserForm';
import { EditUserForm } from '../components/EditUserForm';
import { UsersTable } from '../components/UsersTable';
import { CreateTicketModal } from '@/modules/ticketing/components/CreateTicketModal';
import { createClientUser, getClientUsers, updateUser, deleteUser } from '@/services/users.service';
import { User, CreateUserInput } from '@/types/user';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; clientName: string } | null>(null);
  const [ticketUserTarget, setTicketUserTarget] = useState<User | null>(null);
  
  // Paginazione e filtri
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const pageSize = 10;
  // Stato per modale errore autenticazione Firebase
  const [authErrorModal, setAuthErrorModal] = useState(false);

  // Carica lista utenti con paginazione e filtri
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchQuery]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getClientUsers({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
      });
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalUsers(data.total);
    } catch (error: any) {
      // Gestione errore 401 Firebase
      if (String(error.message).toLowerCase().includes('autenticazione richiesta') || String(error.message).includes('401')) {
        setAuthErrorModal(true);
      } else {
        toast.error(error.message || 'Errore nel caricamento dei clienti');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search con debounce
  const handleSearch = () => {
    // Cerca sempre in nome e email
    const query = searchInput.trim();
    setSearchQuery(query);
    setCurrentPage(1); // Reset a pagina 1 quando si cerca
  };

  // Handle cambio pagina
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle creazione utente
  const handleCreateUser = async (data: CreateUserInput) => {
    try {
      const { message } = await createClientUser(data);
      toast.success(
        `${message}`,
        { autoClose: 8000 }
      );
      setIsModalOpen(false);
      // Ricarica lista
      await loadUsers();
    } catch (error: any) {
      // Gestione robusta per errori email già in uso
      const msg = String(error.message || '').toLowerCase();
      if (
        msg.includes('email già registrata') ||
        msg.includes('email address is already in use') ||
        msg.includes('the email address is already in use') ||
        msg.includes('auth/email-already-exists')
      ) {
        toast.error('Questa email è già registrata.');
      } else {
        toast.error(error.message || 'Errore durante la creazione del cliente');
      }
      // Importante: non ri-lanciare l'errore per evitare che il frontend crashi
    }
  };

  // Handle modifica utente - apre modale edit
  const handleEditUser = (user: User) => {
    setEditUser(user);
  };

  // Handle submit modifica
  const handleUpdateUser = async (data: { firstName: string; lastName: string; phone: string; ghl_contact_id: string }) => {
    if (!editUser) return;

    try {
      await updateUser(editUser.id, data);
      toast.success('Cliente aggiornato con successo');
      setEditUser(null);
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'aggiornamento');
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
      toast.success('Cliente eliminato con successo');
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'eliminazione');
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Handle apertura modale creazione ticket per utente
  const handleCreateTicketForUser = (user: User) => {
    setTicketUserTarget(user);
  };

  // Handle chiusura modale ticket
  const handleTicketModalClose = () => {
    setTicketUserTarget(null);
  };

  // Handle successo creazione ticket
  const handleTicketSuccess = () => {
    setTicketUserTarget(null);
  };

  return (
    <VStack gap={6} align="stretch">
      {/* Modale errore autenticazione Firebase */}
      <Modal
        isOpen={authErrorModal}
        onClose={() => setAuthErrorModal(false)}
        title="Autenticazione richiesta"
        size="md"
      >
        <VStack gap={4} align="center" py={4}>
          <Text color="red.500" fontWeight="bold" fontSize="lg">Sessione scaduta o non autenticato</Text>
          <Text fontSize="md" color="gray.700">Per continuare, effettua nuovamente il login su Firebase.</Text>
          <Button colorScheme="red" onClick={() => { setAuthErrorModal(false); window.location.reload(); }}>Ricarica pagina</Button>
        </VStack>
      </Modal>

      {/* Modale creazione utente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuovo Cliente"
        size="lg"
      >
        <CreateUserForm
          onSubmit={handleCreateUser}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Modale modifica utente */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Modifica Cliente"
        size="lg"
      >
        {editUser && (
          <EditUserForm
            user={editUser}
            onSubmit={handleUpdateUser}
            onCancel={() => setEditUser(null)}
          />
        )}
      </Modal>

      {/* Modale conferma eliminazione */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Conferma Eliminazione"
        size="md"
      >
        <VStack gap={4} align="center" py={4}>
          <Text color="red.500" fontWeight="bold" fontSize="lg">Attenzione!</Text>
          <Text fontSize="md" color="gray.700" textAlign="center">
            Sei sicuro di voler eliminare definitivamente il cliente <strong>{deleteConfirm?.clientName}</strong>?
            <br />
            Questa azione non può essere annullata.
          </Text>
          <HStack gap={3} pt={2}>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Annulla
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              Elimina
            </Button>
          </HStack>
        </VStack>
      </Modal>

      {/* Modale creazione ticket */}
      <CreateTicketModal
        isOpen={!!ticketUserTarget}
        onClose={handleTicketModalClose}
        onSuccess={handleTicketSuccess}
        {...(ticketUserTarget && { targetUser: ticketUserTarget })}
      />

      {/* Header */}
      <Box>
        <VStack gap={2} align="stretch" mb={4}>
          <Flex justify="space-between" align="center" direction="row" gap={3} wrap="wrap">
            <Heading size="sm" color="gray.700" whiteSpace="nowrap">Clienti ({totalUsers})</Heading>
            <Button
              bg="black"
              color="white"
              _hover={{ bg: 'gray.800' }}
              onClick={() => setIsModalOpen(true)}
              size="sm"
              flexShrink={0}
            >
              <HStack gap={2} justify="center">
                <FiPlus />
                <Text display={{ sm: 'inline' }}>Nuovo Cliente</Text>
              </HStack>
            </Button>
          </Flex>
          
          {/* Search Bar - Responsive */}
          <Flex gap={2} direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }}>
            <Box position="relative" flex={{ base: 1, md: '0 0 300px' }}>
              <Icon
                as={FiSearch}
                color="gray.400"
                position="absolute"
                left="12px"
                top="50%"
                transform="translateY(-50%)"
                zIndex={1}
                pointerEvents="none"
              />
              <Input
                placeholder="Cerca per nome o email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                borderRadius="lg"
                bg="white"
                borderColor="gray.200"
                pl="40px"
                size="sm"
                _hover={{ borderColor: 'gray.300' }}
                _focus={{ borderColor: 'black', boxShadow: '0 0 0 1px black' }}
              />
            </Box>

            <Button
              size="sm"
              bg="black"
              color="white"
              onClick={handleSearch}
              _hover={{ bg: 'gray.800' }}
              flexShrink={0}
              w={{ base: 'full', md: 'auto' }}
            >
              Cerca
            </Button>
          </Flex>
        </VStack>

        {isLoading ? (
          <Box p={8} textAlign="center">Caricamento...</Box>
        ) : (
          <>
            <UsersTable
              users={users}
              onEdit={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onCreateTicket={handleCreateTicketForUser}
            />
            
            {/* Paginazione */}
            {totalPages > 1 && (
              <VStack gap={4} mt={6} pt={4} borderTopWidth="1px" align="stretch">
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Pagina {currentPage} di {totalPages}
                </Text>
                
                <VStack gap={3} align="stretch">
                  {/* Pulsanti di navigazione principale */}
                  <HStack gap={2} justify="center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      w={{ base: '50%', sm: 'auto' }}
                    >
                      <HStack gap={1} justify="center">
                        <FiChevronLeft />
                        <Text display={{ base: 'none', sm: 'inline' }}>Precedente</Text>
                      </HStack>
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      w={{ base: '50%', sm: 'auto' }}
                    >
                      <HStack gap={1} justify="center">
                        <Text display={{ base: 'none', sm: 'inline' }}>Successiva</Text>
                        <FiChevronRight />
                      </HStack>
                    </Button>
                  </HStack>

                  {/* Page numbers - solo su desktop */}
                  <HStack gap={2} justify="center" display={{ base: 'none', md: 'flex' }} wrap="wrap">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Mostra: prima pagina, ultima pagina, pagina corrente e ±1
                        return page === 1 ||
                               page === totalPages ||
                               Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, idx, arr) => {
                        // Aggiungi "..." se ci sono gap
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        
                        return (
                          <Box key={page}>
                            {showEllipsis && (
                              <Text px={2} color="gray.400">...</Text>
                            )}
                            <Button
                              size="sm"
                              variant={currentPage === page ? 'solid' : 'ghost'}
                              bg={currentPage === page ? 'black' : 'transparent'}
                              color={currentPage === page ? 'white' : 'gray.700'}
                              _hover={{
                                bg: currentPage === page ? 'gray.800' : 'gray.100'
                              }}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          </Box>
                        );
                      })}
                  </HStack>
                </VStack>
              </VStack>
            )}
          </>
        )}
      </Box>
    </VStack>
  );
}
