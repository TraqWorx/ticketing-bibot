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

import { useState, useRef, useEffect } from 'react';
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
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiFilter, FiRefreshCw, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { TicketCard } from '../components/TicketCard';
import { CreateTicketModal } from '../components/CreateTicketModal';
import { useTickets } from '../hooks/useTickets';
import { TicketStatus, Ticket, TicketPriority } from '../types';
import { toast } from 'react-toastify';

export default function TicketingPage() {
  const { tickets, loading, error, refetch, addTicket, pagination, setPage, getTotalPages } = useTickets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Imposta itemsPerPage in base alla dimensione dello schermo
  const itemsPerPage = useBreakpointValue({ base: 5, md: 8 }) || 8;

  // Filtri status con checkbox - default aperti e in lavorazione
  const [statusFilters, setStatusFilters] = useState({
    open: true,
    inProgress: true,
    completed: false,
  });

  // Filtri priorità con checkbox - default nessuna selezionata
  const [priorityFilters, setPriorityFilters] = useState({
    low: false,
    medium: false,
    high: false,
  });

  // Filtri "in attesa di" con checkbox - default nessuna selezionata
  const [waitingFilters, setWaitingFilters] = useState({
    client: false,
    admin: false,
  });

  // Chiudi il menu filtri quando clicchi al di fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFilterMenu]);

  // Filtra tickets per titolo, ID, status, priorità e attesa risposta
  const filteredTickets = tickets.filter(ticket => {
    // Filtro per ricerca (titolo o ID)
    const matchesSearch = searchQuery
      ? ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    // Filtro per status basato sulle sezioni Asana
    const isOpen = ticket.status === TicketStatus.OPEN;
    const isInProgress = ticket.status === TicketStatus.IN_PROGRESS;
    const isCompleted = ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.RESOLVED;

    const hasAnyStatusFilterActive = statusFilters.open || statusFilters.inProgress || statusFilters.completed;
    const matchesStatus = !hasAnyStatusFilterActive ||
      (statusFilters.open && isOpen) ||
      (statusFilters.inProgress && isInProgress) ||
      (statusFilters.completed && isCompleted);

    // Filtro per priorità
    const hasAnyPriorityFilterActive = priorityFilters.low || priorityFilters.medium || priorityFilters.high;
    const matchesPriority = !hasAnyPriorityFilterActive || (
      (priorityFilters.low && ticket.priority === TicketPriority.LOW) ||
      (priorityFilters.medium && ticket.priority === TicketPriority.MEDIUM) ||
      (priorityFilters.high && ticket.priority === TicketPriority.HIGH)
    );

    // Filtro per "in attesa di"
    const hasAnyWaitingFilterActive = waitingFilters.client || waitingFilters.admin;
    const matchesWaiting = !hasAnyWaitingFilterActive || ticket.waitingFor === null || (
      (waitingFilters.client && ticket.waitingFor === 'client') ||
      (waitingFilters.admin && ticket.waitingFor === 'admin')
    );

    return matchesSearch && matchesStatus && matchesPriority && matchesWaiting;
  });

  // Conta quanti filtri sono attivi
  const activeFiltersCount = 
    Object.values(statusFilters).filter(Boolean).length +
    Object.values(priorityFilters).filter(Boolean).length +
    Object.values(waitingFilters).filter(Boolean).length;

  // Handler apertura modale creazione
  const handleCreateTicket = () => {
    setIsCreateModalOpen(true);
  };

  // Handler successo creazione ticket
  const handleCreateSuccess = (newTicket: Ticket) => {
    // Chiudi modale
    setIsCreateModalOpen(false);

    // Aggiungi il nuovo ticket alla lista locale
    addTicket?.(newTicket);
  };

  return (
    <VStack align="stretch" gap={6}>
      {/* Header: Titolo + Actions */}
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" fontWeight="700" color="gray.900">
            Ticket
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {searchQuery
              ? `${filteredTickets.length} di ${tickets.length} ticket`
              : `${tickets.length} ticket totali`
            }
          </Text>
        </Box>

        <HStack gap={3}>
          <Box position="relative" ref={filterMenuRef}>
            <Button
              size="sm"
              variant="ghost"
              color="gray.700"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <HStack gap={1}>
                <Icon as={FiFilter} />
                <span>Filtri</span>
                {activeFiltersCount > 0 && (
                  <Badge ml={1} colorScheme="blue" fontSize="xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </HStack>
            </Button>

            {/* Menu Filtri con Checkbox */}
            {showFilterMenu && (
              <Box
                position="absolute"
                top="calc(100% + 4px)"
                left="0"
                bg="white"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                shadow="lg"
                py={3}
                px={3}
                minW="200px"
                zIndex={10}
              >
                <VStack align="stretch" gap={3}>
                  <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase">
                    Stato Ticket
                  </Text>

                  {/* Opzione Aperto */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    onClick={() => setStatusFilters(prev => ({ ...prev, open: !prev.open }))}
                    _hover={{ bg: 'gray.50' }}
                    p={2}
                    borderRadius="md"
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderWidth="2px"
                      borderColor={statusFilters.open ? 'blue.500' : 'gray.300'}
                      borderRadius="md"
                      bg={statusFilters.open ? 'blue.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {statusFilters.open && (
                        <Icon as={FiCheck} color="white" boxSize="12px" />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      Aperti
                    </Text>
                  </Flex>

                  {/* Opzione In Lavorazione */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    onClick={() => setStatusFilters(prev => ({ ...prev, inProgress: !prev.inProgress }))}
                    _hover={{ bg: 'gray.50' }}
                    p={2}
                    borderRadius="md"
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderWidth="2px"
                      borderColor={statusFilters.inProgress ? 'orange.500' : 'gray.300'}
                      borderRadius="md"
                      bg={statusFilters.inProgress ? 'orange.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {statusFilters.inProgress && (
                        <Icon as={FiCheck} color="white" boxSize="12px" />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      In Lavorazione
                    </Text>
                  </Flex>

                  {/* Opzione Completato */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    onClick={() => setStatusFilters(prev => ({ ...prev, completed: !prev.completed }))}
                    _hover={{ bg: 'gray.50' }}
                    p={2}
                    borderRadius="md"
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderWidth="2px"
                      borderColor={statusFilters.completed ? 'green.500' : 'gray.300'}
                      borderRadius="md"
                      bg={statusFilters.completed ? 'green.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {statusFilters.completed && (
                        <Icon as={FiCheck} color="white" boxSize="12px" />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      Completati
                    </Text>
                  </Flex>
                </VStack>

                {/* Sezione Priorità */}
                <VStack align="stretch" gap={3} pt={3} borderTop="1px" borderColor="gray.100">
                  <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase">
                    Priorità
                  </Text>

                  {/* Opzione Bassa */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    onClick={() => setPriorityFilters(prev => ({ ...prev, low: !prev.low }))}
                    _hover={{ bg: 'gray.50' }}
                    p={2}
                    borderRadius="md"
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderWidth="2px"
                      borderColor={priorityFilters.low ? 'green.500' : 'gray.300'}
                      borderRadius="md"
                      bg={priorityFilters.low ? 'green.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {priorityFilters.low && (
                        <Icon as={FiCheck} color="white" boxSize="12px" />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      Bassa
                    </Text>
                  </Flex>

                  {/* Opzione Media */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    onClick={() => setPriorityFilters(prev => ({ ...prev, medium: !prev.medium }))}
                    _hover={{ bg: 'gray.50' }}
                    p={2}
                    borderRadius="md"
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderWidth="2px"
                      borderColor={priorityFilters.medium ? 'blue.500' : 'gray.300'}
                      borderRadius="md"
                      bg={priorityFilters.medium ? 'blue.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {priorityFilters.medium && (
                        <Icon as={FiCheck} color="white" boxSize="12px" />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      Media
                    </Text>
                  </Flex>

                  {/* Opzione Alta */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    onClick={() => setPriorityFilters(prev => ({ ...prev, high: !prev.high }))}
                    _hover={{ bg: 'gray.50' }}
                    p={2}
                    borderRadius="md"
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderWidth="2px"
                      borderColor={priorityFilters.high ? 'orange.500' : 'gray.300'}
                      borderRadius="md"
                      bg={priorityFilters.high ? 'orange.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {priorityFilters.high && (
                        <Icon as={FiCheck} color="white" boxSize="12px" />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      Alta
                    </Text>
                  </Flex>

                </VStack>

                {/* Sezione In Attesa Di */}
                <VStack align="stretch" gap={3} pt={3} borderTop="1px" borderColor="gray.100">
                  <Text fontSize="xs" fontWeight="600" color="gray.500" textTransform="uppercase">
                    In Attesa Di
                  </Text>

                  {/* Opzione Risposta Cliente */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    onClick={() => setWaitingFilters(prev => ({ ...prev, client: !prev.client }))}
                    _hover={{ bg: 'gray.50' }}
                    p={2}
                    borderRadius="md"
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderWidth="2px"
                      borderColor={waitingFilters.client ? 'purple.500' : 'gray.300'}
                      borderRadius="md"
                      bg={waitingFilters.client ? 'purple.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {waitingFilters.client && (
                        <Icon as={FiCheck} color="white" boxSize="12px" />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      Risposta Cliente
                    </Text>
                  </Flex>

                  {/* Opzione Risposta Supporto */}
                  <Flex
                    align="center"
                    gap={2}
                    cursor="pointer"
                    onClick={() => setWaitingFilters(prev => ({ ...prev, admin: !prev.admin }))}
                    _hover={{ bg: 'gray.50' }}
                    p={2}
                    borderRadius="md"
                  >
                    <Box
                      w="18px"
                      h="18px"
                      borderWidth="2px"
                      borderColor={waitingFilters.admin ? 'green.500' : 'gray.300'}
                      borderRadius="md"
                      bg={waitingFilters.admin ? 'green.500' : 'transparent'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {waitingFilters.admin && (
                        <Icon as={FiCheck} color="white" boxSize="12px" />
                      )}
                    </Box>
                    <Text fontSize="sm" color="gray.700">
                      Risposta Supporto
                    </Text>
                  </Flex>
                </VStack>
              </Box>
            )}
          </Box>

          <Button
            size="sm"
            variant="outline"
            borderColor="gray.300"
            color="gray.700"
            _hover={{ bg: 'gray.50' }}
            onClick={() => refetch?.()}
            loading={loading}
          >
            <Icon as={FiRefreshCw} />
          </Button>

          <Button
            size="sm"
            bg="black"
            color="white"
            _hover={{ bg: 'gray.800' }}
            onClick={handleCreateTicket}
          >
            <HStack gap={1}>
              <Icon as={FiPlus} />
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
          placeholder="Cerca per titolo o ID ticket..."
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

      {/* Lista Tickets - Due Colonne */}
      <Box bg="gray.50" borderRadius="12px" p={{ base: 3, md: 6 }}>
        {loading ? (
          <Flex
            justify="center"
            align="center"
            h="200px"
          >
            <Spinner size="lg" color="black" />
          </Flex>
        ) : error ? (
          <Flex
            justify="center"
            align="center"
            h="200px"
            borderRadius="8px"
            borderWidth="2px"
            borderStyle="dashed"
            borderColor="red.300"
          >
            <Text fontSize="sm" color="red.500">
              {error}
            </Text>
          </Flex>
        ) : filteredTickets.length === 0 ? (
          <Flex
            justify="center"
            align="center"
            h="200px"
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
          (() => {
            // Calcola quante colonne sono attive per la responsività desktop
            const activeColumnsCount = Object.values(statusFilters).filter(Boolean).length;

            return (
              <Box
                display={{ base: 'block', md: 'grid' }}
                gridTemplateColumns={{
                  md: activeColumnsCount === 1 ? '1fr' :
                    activeColumnsCount === 2 ? '1fr 1fr' :
                      '1fr 1fr 1fr'
                }}
                gap={{ base: 6, md: 4 }}
                alignItems="start"
              >
                {/* Colonna Aperti */}
                {statusFilters.open ? (() => {
                  const openTickets = filteredTickets.filter(t => t.status === TicketStatus.OPEN);
                  const totalPages = getTotalPages('open', openTickets.length);
                  const currentPage = pagination.open.currentPage;
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedTickets = openTickets.slice(startIndex, endIndex);

                  return (
                    <Box
                      display="flex"
                      flexDirection="column"
                      minH="200px"
                    >
                      <HStack mb={3} gap={2}>
                        <Text fontSize="xs" fontWeight="700" color="blue.600" textTransform="uppercase">
                          Aperti
                        </Text>
                        <Badge colorScheme="blue" fontSize="xs">
                          {openTickets.length}
                        </Badge>
                      </HStack>
                      <VStack align="stretch" gap={2}>
                        {paginatedTickets.map((ticket, index) => (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            index={startIndex + index}
                          />
                        ))}
                        {openTickets.length === 0 && (
                          <Box
                            p={4}
                            borderRadius="md"
                            borderWidth="1px"
                            borderStyle="dashed"
                            borderColor="gray.300"
                            textAlign="center"
                          >
                            <Text fontSize="xs" color="gray.400">
                              Nessun ticket aperto
                            </Text>
                          </Box>
                        )}
                        {totalPages > 1 && (
                          <HStack justify="center" mt={2} gap={1}>
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={currentPage === 1}
                              onClick={() => setPage('open', currentPage - 1)}
                            >
                              <Icon as={FiChevronLeft} />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                size="xs"
                                variant={page === currentPage ? 'solid' : 'ghost'}
                                colorScheme={page === currentPage ? 'blue' : 'gray'}
                                onClick={() => setPage('open', page)}
                              >
                                {page}
                              </Button>
                            ))}
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={currentPage === totalPages}
                              onClick={() => setPage('open', currentPage + 1)}
                            >
                              <Icon as={FiChevronRight} />
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  );
                })() : null}

                {/* Colonna In Lavorazione */}
                {statusFilters.inProgress ? (() => {
                  const inProgressTickets = filteredTickets.filter(t => t.status === TicketStatus.IN_PROGRESS);
                  const totalPages = getTotalPages('inProgress', inProgressTickets.length);
                  const currentPage = pagination.inProgress.currentPage;
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedTickets = inProgressTickets.slice(startIndex, endIndex);

                  return (
                    <Box
                      display="flex"
                      flexDirection="column"
                      minH="200px"
                    >
                      <HStack mb={3} gap={2}>
                        <Text fontSize="xs" fontWeight="700" color="orange.600" textTransform="uppercase">
                          In Lavorazione
                        </Text>
                        <Badge colorScheme="orange" fontSize="xs">
                          {inProgressTickets.length}
                        </Badge>
                      </HStack>
                      <VStack align="stretch" gap={2}>
                        {paginatedTickets.map((ticket, index) => (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            index={startIndex + index}
                          />
                        ))}
                        {inProgressTickets.length === 0 && (
                          <Box
                            p={4}
                            borderRadius="md"
                            borderWidth="1px"
                            borderStyle="dashed"
                            borderColor="gray.300"
                            textAlign="center"
                          >
                            <Text fontSize="xs" color="gray.400">
                              Nessun ticket in lavorazione
                            </Text>
                          </Box>
                        )}
                        {totalPages > 1 && (
                          <HStack justify="center" mt={2} gap={1}>
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={currentPage === 1}
                              onClick={() => setPage('inProgress', currentPage - 1)}
                            >
                              <Icon as={FiChevronLeft} />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                size="xs"
                                variant={page === currentPage ? 'solid' : 'ghost'}
                                colorScheme={page === currentPage ? 'orange' : 'gray'}
                                onClick={() => setPage('inProgress', page)}
                              >
                                {page}
                              </Button>
                            ))}
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={currentPage === totalPages}
                              onClick={() => setPage('inProgress', currentPage + 1)}
                            >
                              <Icon as={FiChevronRight} />
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  );
                })() : null}

                {/* Colonna Completati - visualizzazione normale */}
                {statusFilters.completed && !statusFilters.open && !statusFilters.inProgress ? (() => {
                  const completedTickets = filteredTickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED);
                  const totalPages = getTotalPages('completed', completedTickets.length);
                  const currentPage = pagination.completed.currentPage;
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedTickets = completedTickets.slice(startIndex, endIndex);

                  return (
                    <Box
                      display="flex"
                      flexDirection="column"
                      minH="200px"
                      gridColumn="1 / -1"
                    >
                      <HStack mb={3} gap={2}>
                        <Text fontSize="xs" fontWeight="700" color="green.600" textTransform="uppercase">
                          Completati
                        </Text>
                        <Badge colorScheme="green" fontSize="xs">
                          {completedTickets.length}
                        </Badge>
                      </HStack>
                      <VStack align="stretch" gap={2}>
                        {paginatedTickets.map((ticket, index) => (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            index={startIndex + index}
                          />
                        ))}
                        {completedTickets.length === 0 && (
                          <Box
                            p={4}
                            borderRadius="md"
                            borderWidth="1px"
                            borderStyle="dashed"
                            borderColor="gray.300"
                            textAlign="center"
                          >
                            <Text fontSize="xs" color="gray.400">
                              Nessun ticket completato
                            </Text>
                          </Box>
                        )}
                        {totalPages > 1 && (
                          <HStack justify="center" mt={2} gap={1}>
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={currentPage === 1}
                              onClick={() => setPage('completed', currentPage - 1)}
                            >
                              <Icon as={FiChevronLeft} />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                size="xs"
                                variant={page === currentPage ? 'solid' : 'ghost'}
                                colorScheme={page === currentPage ? 'green' : 'gray'}
                                onClick={() => setPage('completed', page)}
                              >
                                {page}
                              </Button>
                            ))}
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={currentPage === totalPages}
                              onClick={() => setPage('completed', currentPage + 1)}
                            >
                              <Icon as={FiChevronRight} />
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  );
                })() : null}

                {/* Se solo completati è attivo, mostra lista semplice */}
                {statusFilters.completed && (statusFilters.open || statusFilters.inProgress) ? (() => {
                  const completedTickets = filteredTickets.filter(t => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED);
                  const totalPages = getTotalPages('completed', completedTickets.length);
                  const currentPage = pagination.completed.currentPage;
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedTickets = completedTickets.slice(startIndex, endIndex);
                  return (
                    <Box
                      display="flex"
                      flexDirection="column"
                      minH="200px"
                    >
                      <HStack mb={3} gap={2}>
                        <Text fontSize="xs" fontWeight="700" color="green.600" textTransform="uppercase">
                          Completati
                        </Text>
                        <Badge colorScheme="green" fontSize="xs">
                          {completedTickets.length}
                        </Badge>
                      </HStack>
                      <VStack align="stretch" gap={2}>
                        {paginatedTickets.map((ticket, index) => (
                          <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            index={startIndex + index}
                          />
                        ))}
                        {completedTickets.length === 0 && (
                          <Box
                            p={4}
                            borderRadius="md"
                            borderWidth="1px"
                            borderStyle="dashed"
                            borderColor="gray.300"
                            textAlign="center"
                          >
                            <Text fontSize="xs" color="gray.400">
                              Nessun ticket completato
                            </Text>
                          </Box>
                        )}
                        {totalPages > 1 && (
                          <HStack justify="center" mt={2} gap={1}>
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={currentPage === 1}
                              onClick={() => setPage('completed', currentPage - 1)}
                            >
                              <Icon as={FiChevronLeft} />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                size="xs"
                                variant={page === currentPage ? 'solid' : 'ghost'}
                                colorScheme={page === currentPage ? 'green' : 'gray'}
                                onClick={() => setPage('completed', page)}
                              >
                                {page}
                              </Button>
                            ))}
                            <Button
                              size="xs"
                              variant="ghost"
                              disabled={currentPage === totalPages}
                              onClick={() => setPage('completed', currentPage + 1)}
                            >
                              <Icon as={FiChevronRight} />
                            </Button>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  );
                })() : null}
              </Box>
            );
          })()
        )}
      </Box>

      {/* Modale Creazione Ticket */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </VStack>
  );
}
