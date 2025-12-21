/**
 * COMPONENT: UsersTable
 * 
 * Tabella lista utenti CLIENT
 * 
 * Features:
 * - Visualizzazione utenti
 * - Badge stato (Attivo/Disabilitato)
 * - Azioni: Modifica, Disabilita/Abilita
 * 
 * Pattern: Presentational component
 * Design: Tabella responsive, azioni chiare
 */

import { 
  Box,
  Badge,
  IconButton,
  HStack,
  Text
} from '@chakra-ui/react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { User } from '@/types';

interface UsersTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDeleteUser?: (userId: string, clientName: string) => void;
}

export const UsersTable = ({ users, onEdit, onDeleteUser }: UsersTableProps) => {
  if (users.length === 0) {
    return (
      <Box p={8} textAlign="center" bg="white" borderRadius="lg" borderWidth="1px">
        <Text color="gray.500">Nessun utente trovato</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto" bg="white" borderRadius="lg" borderWidth="1px">
      <Box as="table" width="100%" css={{ borderCollapse: 'collapse' }}>
        <Box as="thead" bg="gray.50" borderBottomWidth="1px">
          <Box as="tr">
            <Box as="th" p={3} textAlign="center" fontSize="sm" fontWeight="semibold" width="60px">#</Box>
            <Box as="th" p={3} textAlign="left" fontSize="sm" fontWeight="semibold">ID</Box>
            <Box as="th" p={3} textAlign="left" fontSize="sm" fontWeight="semibold">Nome</Box>
            <Box as="th" p={3} textAlign="left" fontSize="sm" fontWeight="semibold">Email</Box>
            <Box as="th" p={3} textAlign="left" fontSize="sm" fontWeight="semibold">Telefono</Box>
            <Box as="th" p={3} textAlign="left" fontSize="sm" fontWeight="semibold">GHL ID</Box>
            <Box as="th" p={3} textAlign="right" fontSize="sm" fontWeight="semibold">Azioni</Box>
          </Box>
        </Box>
        <Box as="tbody">
          {users.map((user, index) => (
            <Box as="tr" key={user.id} borderBottomWidth="1px" _hover={{ bg: 'gray.50' }}>
              <Box as="td" p={3} textAlign="center" color="gray.500" fontSize="sm">{index + 1}</Box>
              <Box as="td" p={3}>
                <Text fontSize="xs" color="gray.600" fontFamily="mono">{user.id}</Text>
              </Box>
              <Box as="td" p={3} fontWeight="medium">{`${user.firstName} ${user.lastName}`}</Box>
              <Box as="td" p={3}>{user.email}</Box>
              <Box as="td" p={3}>{user.phone}</Box>
              <Box as="td" p={3}>
                <Text fontSize="sm" color="gray.600">{user.ghl_contact_id}</Text>
              </Box>
              <Box as="td" p={3}>
                <HStack gap={2} justify="flex-end">
                  {onEdit && (
                    <IconButton
                      aria-label="Modifica utente"
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(user)}
                    >
                      <FiEdit2 />
                    </IconButton>
                  )}
                  {onDeleteUser && (
                    <IconButton
                      aria-label="Elimina utente"
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => onDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                    >
                      <FiTrash2 />
                    </IconButton>
                  )}
                </HStack>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
