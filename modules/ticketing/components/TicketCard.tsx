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
 * - Link navigation invece di modal
 */

import { Box, Badge, Text, HStack, VStack, Flex, Icon, Tooltip } from '@chakra-ui/react';
import { FiMessageSquare, FiPaperclip, FiCalendar, FiMoreVertical, FiClock } from 'react-icons/fi';
  // Badge Priorità
  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Bassa';
      default: return '-';
    }
  };

  // Colore custom per badge priorità
  const getPriorityBg = (priority?: string) => {
    switch (priority) {
      case 'low': return 'green.100'; // verdino
      case 'medium': return 'yellow.100'; // giallino
      case 'high': return 'red.200'; // rosso chiaro
      case 'urgent': return 'red.400'; // rosso acceso
      default: return 'gray.100';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'low': return 'green.700';
      case 'medium': return 'yellow.800';
      case 'high': return 'red.700';
      case 'urgent': return 'white';
      default: return 'gray.700';
    }
  };
import { useRouter } from 'next/router';
import { Ticket, TicketStatus } from '../types';
import { formatDueDate } from '../hooks/useTickets';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  index?: number;
}

export const TicketCard = ({ ticket, onClick, index }: TicketCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Naviga alla pagina di dettaglio
      router.push(`/clienti/ticketing/${ticket.id}`);
    }
  };

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
      onClick={handleClick}
      transition="all 0.2s"
      w={{ base: '100%', sm: '340px', md: '340px' }}
      minW={{ base: '100%', sm: '340px', md: '340px' }}
      maxW={{ base: '100%', sm: '340px', md: '340px' }}
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
              mb={1}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="pre-line"
              wordBreak="break-word"
              maxW="100%"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={ticket.title && ticket.title.length >= 32 ? ticket.title : undefined}
            >
              {ticket.title}
            </Text>
            {/* BADGE PRIORITÀ + ATTESA RISPOSTA */}
            <HStack gap={2} mt={1} flexWrap="wrap">
              {/* Badge Priorità */}
              <Badge
                bg={getPriorityBg(ticket.priority)}
                color={getPriorityColor(ticket.priority)}
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                fontWeight="600"
              >
                Priorità: {getPriorityLabel(ticket.priority)}
              </Badge>
              {/* Badge solo Attesa Admin */}
              {ticket.waitingFor === 'admin' && (
                <Badge
                  bg="purple.100"
                  color="purple.700"
                  fontSize="10px"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontWeight="600"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon as={FiClock} boxSize="10px" />
                  Attesa Admin
                </Badge>
              )}
              {/* Badge Data di Scadenza */}
              <Badge
                bg={formatDueDate(ticket.dueDate).colorScheme === 'red' ? 'red.100' :
                    formatDueDate(ticket.dueDate).colorScheme === 'orange' ? 'orange.100' :
                    formatDueDate(ticket.dueDate).colorScheme === 'yellow' ? 'yellow.100' :
                    formatDueDate(ticket.dueDate).colorScheme === 'blue' ? 'blue.100' : 'gray.100'}
                color={formatDueDate(ticket.dueDate).colorScheme === 'red' ? 'red.700' :
                       formatDueDate(ticket.dueDate).colorScheme === 'orange' ? 'orange.700' :
                       formatDueDate(ticket.dueDate).colorScheme === 'yellow' ? 'yellow.700' :
                       formatDueDate(ticket.dueDate).colorScheme === 'blue' ? 'blue.700' : 'gray.700'}
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                fontWeight="600"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <Icon as={FiCalendar} boxSize="10px" />
                {formatDueDate(ticket.dueDate).text}
              </Badge>
            </HStack>
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
