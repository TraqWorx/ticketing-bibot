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
import { Ticket } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
}

export const TicketCard = ({ ticket, onClick }: TicketCardProps) => {
  const priorityBorderColors: Record<string, string> = {
    low: 'gray.300',
    medium: 'yellow.400',
    high: 'orange.400',
    urgent: 'red.500',
  };

  const priorityIndicatorColors: Record<string, string> = {
    low: 'gray.400',
    medium: 'yellow.500',
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
      borderRadius="10px"
      borderWidth="1px"
      borderColor="gray.200"
      borderLeftWidth="3px"
      borderLeftColor={priorityBorderColors[ticket.priority]}
      p={4}
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{
        shadow: 'lg',
        transform: 'translateY(-2px)',
        borderColor: 'gray.300',
      }}
    >
      <VStack align="stretch" gap={3}>
        {/* Header: Titolo + More Actions */}
        <Flex justify="space-between" align="start">
          <Text
            fontSize="sm"
            fontWeight="600"
            color="gray.800"
            lineClamp={2}
            flex={1}
            lineHeight="1.4"
          >
            {ticket.title}
          </Text>
          <Icon
            as={FiMoreVertical}
            color="gray.400"
            cursor="pointer"
            ml={2}
            _hover={{ color: 'gray.600' }}
          />
        </Flex>

        {/* Description (se presente) */}
        {ticket.description && (
          <Text
            fontSize="xs"
            color="gray.600"
            lineClamp={2}
            lineHeight="1.5"
          >
            {ticket.description}
          </Text>
        )}

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <HStack gap={2} flexWrap="wrap">
            {ticket.tags.slice(0, 3).map((tag, idx) => (
              <Badge
                key={idx}
                fontSize="10px"
                px={2}
                py={0.5}
                borderRadius="full"
                bg="gray.100"
                color="gray.700"
                fontWeight="500"
              >
                {tag}
              </Badge>
            ))}
            {ticket.tags.length > 3 && (
              <Text fontSize="10px" color="gray.500">
                +{ticket.tags.length - 3}
              </Text>
            )}
          </HStack>
        )}

        {/* Footer: Metadata + Assignee */}
        <Flex justify="space-between" align="center" pt={2}>
          {/* Left: Icons metadata */}
          <HStack gap={3} fontSize="xs" color="gray.500">
            {/* Priority Indicator Dot */}
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={priorityIndicatorColors[ticket.priority]}
            />

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
          </HStack>

          {/* Right: Assignee Avatar */}
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
        </Flex>
      </VStack>
    </Box>
  );
};
