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
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiFileText, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import { User } from '@/types';

interface UsersTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDeleteUser?: (userId: string, clientName: string) => void;
  onCreateTicket?: (user: User) => void;
}

export const UsersTable = ({ users, onEdit, onDeleteUser, onCreateTicket }: UsersTableProps) => {
  if (users.length === 0) {
    return (
      <Box p={8} textAlign="center" bg="white" borderRadius="lg" borderWidth="1px">
        <Text color="gray.500">Nessun utente trovato</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto" bg="white" borderRadius="lg" borderWidth="1px">
      <Box as="table" width="100%" css={{ borderCollapse: 'collapse' }} minW="800px">
        <Box as="thead" bg="gray.50" borderBottomWidth="1px">
          <Box as="tr">
            <Box as="th" p={2} textAlign="center" fontSize="xs" fontWeight="semibold" width="50px">#</Box>
            <Box as="th" p={2} textAlign="left" fontSize="xs" fontWeight="semibold">Nome</Box>
            <Box as="th" p={2} textAlign="left" fontSize="xs" fontWeight="semibold">Email</Box>
            <Box as="th" p={2} textAlign="left" fontSize="xs" fontWeight="semibold">Telefono</Box>
            <Box as="th" p={2} textAlign="left" fontSize="xs" fontWeight="semibold">GHL ID</Box>
            <Box as="th" p={2} textAlign="right" fontSize="xs" fontWeight="semibold" width="120px">Azioni</Box>
          </Box>
        </Box>
        <Box as="tbody">
          {users.map((user, index) => (
            <Box as="tr" key={user.id} borderBottomWidth="1px" _hover={{ bg: 'gray.50' }}>
              <Box as="td" p={2} textAlign="center" color="gray.500" fontSize="xs">{index + 1}</Box>
              <Box as="td" p={2} fontWeight="medium" fontSize="sm">{`${user.firstName} ${user.lastName}`}</Box>
              <Box as="td" p={2} fontSize="sm">
                <HStack gap={1}>
                  <Icon as={FiMail} color="gray.500" boxSize={3} />
                  <Text fontSize="xs" color="gray.700">{user.email}</Text>
                </HStack>
              </Box>
              <Box as="td" p={2} fontSize="sm">
                <HStack gap={1}>
                  <Icon as={FiPhone} color="gray.500" boxSize={3} />
                  <Text fontSize="xs" color="gray.700">{user.phone}</Text>
                </HStack>
              </Box>
              <Box as="td" p={2}>
                <Text fontSize="xs" color="gray.600" fontFamily="mono">{user.ghl_contact_id}</Text>
              </Box>
              <Box as="td" p={2}>
                <HStack gap={1} justify="flex-end">
                  {onCreateTicket && (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label="Crea ticket"
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => onCreateTicket(user)}
                        >
                          <FiFileText />
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content>Crea ticket</Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>
                  )}
                  {onEdit && (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label="Modifica"
                          size="xs"
                          variant="ghost"
                          onClick={() => onEdit(user)}
                        >
                          <FiEdit2 />
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content>Modifica</Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>
                  )}
                  {onDeleteUser && (
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label="Elimina"
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => onDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                        >
                          <FiTrash2 />
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content>Elimina</Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>
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
