/**
 * MODULE: Ticketing System - Main Page
 * 
 * Pagina principale del modulo Ticketing
 * Architettura: Composizione di componenti riutilizzabili + hook per logica
 */

import { Box, Heading, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { TicketCard } from '../components/TicketCard';
import { useTickets } from '../hooks/useTickets';

export default function TicketingPage() {
  const { tickets, loading, error } = useTickets();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6}>Ticketing System</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
