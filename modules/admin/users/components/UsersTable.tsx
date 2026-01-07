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
  Menu,
  Icon,
} from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/react';
import { FiEdit2, FiTrash2, FiFileText, FiMail, FiPhone, FiMoreVertical } from 'react-icons/fi';
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
            <Box as="th" p={2} textAlign="left" fontSize="xs" fontWeight="semibold">Azienda</Box>
            <Box as="th" p={2} textAlign="left" fontSize="xs" fontWeight="semibold">GHL ID</Box>
            <Box as="th" p={2} textAlign="left" fontSize="xs" fontWeight="semibold" width="120px">Azioni</Box>
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
                <Text fontSize="xs" color="gray.700">{user.company || '-'}</Text>
              </Box>
              <Box as="td" p={2}>
                <Text fontSize="xs" color="gray.600" fontFamily="mono">{user.ghl_contact_id}</Text>
              </Box>
              <Box as="td" p={2}>
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <IconButton
                      aria-label="Azioni"
                      size="xs"
                      variant="ghost"
                      colorScheme="gray"
                    >
                      <FiMoreVertical />
                    </IconButton>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content>
                      {onCreateTicket && (
                        <Menu.Item value="create-ticket" onClick={() => onCreateTicket(user)}>
                          <HStack gap={2}>
                            <Icon as={FiFileText} />
                            <Text>Crea ticket</Text>
                          </HStack>
                        </Menu.Item>
                      )}
                      {onEdit && (
                        <Menu.Item value="edit-user" onClick={() => onEdit(user)}>
                          <HStack gap={2}>
                            <Icon as={FiEdit2} />
                            <Text>Modifica</Text>
                          </HStack>
                        </Menu.Item>
                      )}
                      {onDeleteUser && (
                        <Menu.Item
                          value="delete-user"
                          onClick={() => onDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          color="red.600"
                        >
                          <HStack gap={2}>
                            <Icon as={FiTrash2} />
                            <Text>Elimina</Text>
                          </HStack>
                        </Menu.Item>
                      )}
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
