/**
 * MODULE: Ticketing System - TicketCard Component
 * 
 * Componente UI riutilizzabile per visualizzare un singolo ticket
 * Design: Card minimalista con badge per status e priorità
 */

import { Box, Badge, Text, Heading, HStack, VStack } from '@chakra-ui/react';
import { Ticket } from '../types';

interface TicketCardProps {
  ticket: Ticket;
}

export const TicketCard = ({ ticket }: TicketCardProps) => {
  const statusColors: Record<string, string> = {
    open: 'red',
    in_progress: 'blue',
    resolved: 'green',
    closed: 'gray',
  };

  const priorityColors: Record<string, string> = {
    low: 'gray',
    medium: 'yellow',
    high: 'orange',
    urgent: 'red',
  };

  return (
    <Box
      p={5}
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      _hover={{ shadow: 'md', cursor: 'pointer' }}
      transition="all 0.2s"
    >
      <VStack align="start" spacing={3}>
        <HStack justify="space-between" w="full">
          <Heading size="sm">{ticket.title}</Heading>
          <HStack>
            <Badge colorScheme={statusColors[ticket.status]}>
              {ticket.status}
            </Badge>
            <Badge colorScheme={priorityColors[ticket.priority]}>
              {ticket.priority}
            </Badge>
          </HStack>
        </HStack>
        
        <Text color="gray.600" fontSize="sm">
          {ticket.description}
        </Text>
        
        {ticket.assignee && (
          <Text fontSize="xs" color="gray.500">
            Assegnato a: {ticket.assignee}
          </Text>
        )}
      </VStack>
    </Box>
  );
};
