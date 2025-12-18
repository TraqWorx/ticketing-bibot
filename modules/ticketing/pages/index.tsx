/**
 * MODULE: Ticketing System - Main Page
 * 
 * Board view ispirata ad Asana
 * Layout a colonne per status con drag & drop ready
 * 
 * Features:
 * - Board view con colonne per ogni status
 * - Header con filtri e azioni rapide
 * - Contatori per ogni colonna
 * - Design moderno e responsive
 */

import { useState } from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Spinner,
  Text,
  Input,
  Button,
  Flex,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiFilter } from 'react-icons/fi';
import { TicketCard } from '../components/TicketCard';
import { TicketDetailModal } from '../components/TicketDetailModal';
import { useTickets } from '../hooks/useTickets';
import { TicketStatus, Ticket } from '../types';
import { toast } from 'react-toastify';

export default function TicketingPage() {
  const { tickets, loading, error } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Filtra tickets per titolo
  const filteredTickets = searchQuery
    ? tickets.filter(ticket => 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tickets;

  // Raggruppa tickets filtrati per status
  const ticketsByStatus = {
    [TicketStatus.OPEN]: filteredTickets.filter(t => t.status === TicketStatus.OPEN),
    [TicketStatus.IN_PROGRESS]: filteredTickets.filter(t => t.status === TicketStatus.IN_PROGRESS),
    [TicketStatus.RESOLVED]: filteredTickets.filter(t => t.status === TicketStatus.RESOLVED),
    [TicketStatus.CLOSED]: filteredTickets.filter(t => t.status === TicketStatus.CLOSED),
  };

  const statusLabels = {
    [TicketStatus.OPEN]: 'Da Fare',
    [TicketStatus.IN_PROGRESS]: 'In Corso',
    [TicketStatus.RESOLVED]: 'Risolti',
    [TicketStatus.CLOSED]: 'Chiusi',
  };

  const statusColors = {
    [TicketStatus.OPEN]: 'red.500',
    [TicketStatus.IN_PROGRESS]: 'blue.500',
    [TicketStatus.RESOLVED]: 'green.500',
    [TicketStatus.CLOSED]: 'gray.500',
  };

  // Handler apertura modale ticket
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  // Handler aggiunta commento
  const handleAddComment = async (content: string) => {
    // TODO: Implementare chiamata API per aggiungere commento
    toast.success('Commento aggiunto con successo!');
    // Simulazione: chiudi modale e ricarica
    setSelectedTicket(null);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="black" />        
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500" fontSize="lg">{error}</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={6}>
      {/* Header: Titolo + Actions */}
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" fontWeight="700" color="gray.900">
            I Miei Ticket
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {searchQuery 
              ? `${filteredTickets.length} di ${tickets.length} ticket` 
              : `${tickets.length} ticket totali`
            }
          </Text>
        </Box>
        
        <HStack gap={3}>
          <Button
            size="sm"
            variant="ghost"
            color="gray.700"
          >
            <HStack gap={1}>
              <FiFilter />
              <span>Filtri</span>
            </HStack>
          </Button>
          
          <Button
            size="sm"
            bg="black"
            color="white"
            _hover={{ bg: 'gray.800' }}
          >
            <HStack gap={1}>
              <FiPlus />
              <span>Nuovo Ticket</span>
            </HStack>
          </Button>
        </HStack>
      </Flex>

      {/* Search Bar */}
      <Box position="relative" maxW="400px">
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
          placeholder="Cerca per titolo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          borderRadius="lg"
          bg="white"
          borderColor="gray.200"
          pl="40px"
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'black', boxShadow: '0 0 0 1px black' }}
        />
      </Box>

      {/* Board View: Colonne per Status */}
      <Box overflowX="auto" pb={4}>
        <HStack
          align="stretch"
          gap={4}
          minW="fit-content"
        >
          {Object.entries(ticketsByStatus).map(([status, statusTickets]) => (
            <VStack
              key={status}
              align="stretch"
              gap={3}
              bg="gray.50"
              borderRadius="12px"
              p={4}
              minW="320px"
              maxW="320px"
              minH="500px"
            >
              {/* Column Header */}
              <HStack justify="space-between" mb={2}>
                <HStack gap={2}>
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg={statusColors[status as TicketStatus]}
                  />
                  <Text
                    fontSize="sm"
                    fontWeight="700"
                    color="gray.800"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {statusLabels[status as TicketStatus]}
                  </Text>
                  <Badge
                    bg="gray.200"
                    color="gray.700"
                    borderRadius="full"
                    px={2}
                    py={0.5}
                    fontSize="xs"
                    fontWeight="600"
                  >
                    {statusTickets.length}
                  </Badge>
                </HStack>
                
                <Flex
                  align="center"
                  justify="center"
                  w="24px"
                  h="24px"
                  borderRadius="md"
                  cursor="pointer"
                  color="gray.500"
                  _hover={{ bg: 'gray.200', color: 'gray.700' }}
                  transition="all 0.2s"
                >
                  <Icon as={FiPlus} boxSize="16px" />
                </Flex>
              </HStack>

              {/* Tickets in questa colonna */}
              <VStack align="stretch" gap={3} overflowY="auto">
                {statusTickets.length === 0 ? (
                  <Flex
                    justify="center"
                    align="center"
                    h="120px"
                    borderRadius="8px"
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor="gray.300"
                  >
                    <Text fontSize="sm" color="gray.500">
                      Nessun ticket
                    </Text>
                  </Flex>
                ) : (
                  statusTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => handleTicketClick(ticket)}
                    />
                  ))
                )}
              </VStack>
            </VStack>
          ))}
        </HStack>
      </Box>

      {/* Modale Dettaglio Ticket */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAddComment={handleAddComment}
        />
      )}
    </VStack>
  );
}
