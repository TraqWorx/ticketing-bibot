/**
 * MODULE: Ticketing System - TicketCard Component
 * 
 * Card ticket ispirata ad Asana
 * Design: Moderno, compatto, informazioni visive immediate
 * 
 * Features:
 * - Avatar assegnee con fallback iniziali
 * - Priority indicator (bordo colorato)
 * - Tags visivi
 * - Metadata footer (commenti, allegati, data)
 * - Hover effects smooth
 */

import { Box, Badge, Text, HStack, VStack, Flex, Icon } from '@chakra-ui/react';
import { FiMessageSquare, FiPaperclip, FiCalendar, FiMoreVertical } from 'react-icons/fi';
import { Ticket, TicketStatus } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  index?: number;
}

export const TicketCard = ({ ticket, onClick, index }: TicketCardProps) => {
  // Colore bordo basato su status dalle sezioni Asana
  const getStatusBorderColor = () => {
    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
      return 'green.400';
    }
    if (ticket.status === TicketStatus.IN_PROGRESS) {
      return 'orange.400';
    }
    return 'blue.400';
  };

  const priorityIndicatorColors: Record<string, string> = {
    low: 'gray.400',
    medium: 'green.500',
    high: 'orange.500',
    urgent: 'red.600',
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const diffDays = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Domani';
    if (diffDays === -1) return 'Ieri';
    if (diffDays < -1) return `${Math.abs(diffDays)} giorni fa`;
    
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isDueSoon = ticket.dueDate && new Date(ticket.dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date();

  return (
    <Box
      bg="white"
      borderRadius="8px"
      borderWidth="1px"
      borderColor="gray.200"
      borderLeftWidth="3px"
      borderLeftColor={getStatusBorderColor()}
      p={3}
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{
        shadow: 'md',
        borderColor: 'gray.300',
        bg: 'gray.50'
      }}
    >
      <Flex align="center" gap={3}>
        {/* Numero progressivo */}
        {index !== undefined && (
          <Flex
            align="center"
            justify="center"
            minW="32px"
            h="32px"
            borderRadius="md"
            bg="gray.100"
            color="gray.600"
            fontSize="xs"
            fontWeight="700"
          >
            #{index + 1}
          </Flex>
        )}

        {/* Contenuto principale */}
        <Flex flex="1" align="center" gap={4} minW="0">
          {/* Titolo e descrizione */}
          <Box flex="1" minW="0">
            <Text
              fontSize="sm"
              fontWeight="600"
              color="gray.800"
              noOfLines={1}
              mb={1}
            >
              {ticket.title}
            </Text>
          </Box>

          {/* Metadata compatta */}
          <HStack gap={4} fontSize="xs" color="gray.500" flexShrink={0}>
            {/* Comments */}
            {(ticket.commentsCount ?? 0) > 0 && (
              <HStack gap={1}>
                <Icon as={FiMessageSquare} boxSize="14px" />
                <Text>{ticket.commentsCount}</Text>
              </HStack>
            )}

            {/* Attachments */}
            {(ticket.attachmentsCount ?? 0) > 0 && (
              <HStack gap={1}>
                <Icon as={FiPaperclip} boxSize="14px" />
                <Text>{ticket.attachmentsCount}</Text>
              </HStack>
            )}

            {/* Due Date */}
            {ticket.dueDate && (
              <HStack
                gap={1}
                color={isOverdue ? 'red.500' : isDueSoon ? 'orange.500' : 'gray.500'}
                fontWeight={isOverdue || isDueSoon ? '600' : 'normal'}
              >
                <Icon as={FiCalendar} boxSize="14px" />
                <Text fontSize="10px">{formatDate(ticket.dueDate)}</Text>
              </HStack>
            )}

            {/* Assignee Avatar */}
            {ticket.assignee && (
              <Flex
                align="center"
                justify="center"
                w="24px"
                h="24px"
                borderRadius="full"
                bg="black"
                color="white"
                fontSize="10px"
                fontWeight="600"
              >
                {getInitials(ticket.assignee.name)}
              </Flex>
            )}
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
};
