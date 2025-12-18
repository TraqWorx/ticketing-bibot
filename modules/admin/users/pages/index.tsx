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
import { createClientUser, getClientUsers, updateUser, deleteUser } from '@/services/users.service';
import { User, CreateUserInput } from '@/types/user';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; clientName: string } | null>(null);
  
  // Paginazione e filtri
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterField, setFilterField] = useState<'all' | 'name' | 'email'>('all');
  const pageSize = 10;

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
      toast.error(error.message || 'Errore nel caricamento dei clienti');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search con debounce
  const handleSearch = () => {
    // Costruisci query in base al filtro selezionato
    let query = searchInput.trim();
    if (query && filterField !== 'all') {
      query = `${filterField}:${query}`;
    }
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
      toast.success('Cliente eliminato definitivamente');
      await loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'eliminazione');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <VStack gap={6} align="stretch">
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

      {/* Edit User Modal */}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="⚠️ Conferma Eliminazione"
        size="md"
      >
        <VStack gap={4} align="stretch">
          <Box bg="red.50" p={4} borderRadius="md" borderLeftWidth="4px" borderLeftColor="red.500">
            <Text fontWeight="bold" color="red.700" mb={2}>
              ATTENZIONE: Operazione irreversibile
            </Text>
            <Text fontSize="sm" color="gray.700" mb={3}>
              Stai per eliminare definitivamente il cliente <strong>"{deleteConfirm?.clientName}"</strong>.
            </Text>
            <VStack align="start" gap={1} fontSize="sm" color="gray.700">
              <Text>• Eliminazione account Firebase</Text>
              <Text>• Eliminazione dati Firestore</Text>
              <Text>• Perdita di tutti i dati associati</Text>
            </VStack>
          </Box>

          <HStack gap={3} justify="flex-end" pt={2}>
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
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Lista Clienti ({totalUsers})</Heading>
          
          {/* Search Bar con Filtri */}
          <HStack gap={2}>
            <Box
              as="select"
              size="sm"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
              bg="white"
              px={3}
              py={2}
              fontSize="sm"
              cursor="pointer"
              value={filterField}
              onChange={(e) => setFilterField(e.target.value as 'all' | 'name' | 'email')}
              _hover={{ borderColor: 'gray.300' }}
              _focus={{ borderColor: 'black', outline: 'none', boxShadow: '0 0 0 1px black' }}
            >
              <option value="all">Tutti i campi</option>
              <option value="name">Nome</option>
              <option value="email">Email</option>
            </Box>

            <Box position="relative" w="250px">
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
                placeholder={
                  filterField === 'name' ? 'Cerca per nome...' :
                  filterField === 'email' ? 'Cerca per email...' :
                  'Cerca cliente...'
                }
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
            >
              Cerca
            </Button>
          </HStack>
        </Flex>

        {isLoading ? (
          <Box p={8} textAlign="center">Caricamento...</Box>
        ) : (
          <>
            <UsersTable
              users={users}
              onEdit={handleEditUser}
              onDeleteUser={handleDeleteUser}
            />
            
            {/* Paginazione */}
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6} pt={4} borderTopWidth="1px">
                <Text fontSize="sm" color="gray.600">
                  Pagina {currentPage} di {totalPages}
                </Text>
                
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<FiChevronLeft />}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Precedente
                  </Button>
                  
                  {/* Page numbers */}
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
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    rightIcon={<FiChevronRight />}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Successiva
                  </Button>
                </HStack>
              </Flex>
            )}
          </>
        )}
      </Box>
    </VStack>
  );
}
