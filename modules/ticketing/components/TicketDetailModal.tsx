/**
 * MODULE: Ticketing - TicketDetailModal Component
 * 
 * Modale dettaglio ticket stile Asana
 * 
 * Features:
 * - Header con titolo, status badge, priority badge
 * - Descrizione completa
 * - Timeline commenti con avatar e timestamp
 * - Input per nuovo commento
 * - Design moderno e responsive
 */

import { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Badge,
    Flex,
    Icon,
    Button,
    Textarea,
} from '@chakra-ui/react';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { Ticket } from '../types';
import { Modal } from '@/components/Modal';

interface TicketDetailModalProps {
    ticket: Ticket;
    isOpen: boolean;
    onClose: () => void;
    onAddComment?: (content: string) => void;
}

export const TicketDetailModal = ({ ticket, isOpen, onClose, onAddComment }: TicketDetailModalProps) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const statusColors: Record<string, string> = {
        open: 'red.500',
        in_progress: 'blue.500',
        resolved: 'green.500',
        closed: 'gray.500',
    };

    const statusLabels: Record<string, string> = {
        open: 'Da Fare',
        in_progress: 'In Corso',
        resolved: 'Risolto',
        closed: 'Chiuso',
    };

    const priorityColors: Record<string, string> = {
        low: 'gray.500',
        medium: 'yellow.500',
        high: 'orange.500',
        urgent: 'red.600',
    };

    const priorityLabels: Record<string, string> = {
        low: 'Bassa',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente',
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Adesso';
        if (diffMins < 60) return `${diffMins} min fa`;
        if (diffHours < 24) return `${diffHours} ore fa`;
        if (diffDays < 7) return `${diffDays} giorni fa`;

        return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
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

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            if (onAddComment) {
                await onAddComment(newComment);
            }
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Dettaglio Ticket"
            size="2xl"
        >
            <VStack align="stretch" spacing={6}>
                {/* Titolo */}
                <Box>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900" lineHeight="1.3" mb={2}>
                        {ticket.title}
                    </Text>
                    <Text fontSize="sm" color="gray.500" fontWeight="500">
                        Ticket #{ticket.id.slice(0, 8)}
                    </Text>
                </Box>

                {/* Badges Status e Priority */}
                <HStack spacing={3}>
                    <Badge
                        bg={statusColors[ticket.status]}
                        color="white"
                        px={4}
                        py={1.5}
                        borderRadius="full"
                        fontWeight="600"
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                        boxShadow="sm"
                    >
                        {statusLabels[ticket.status]}
                    </Badge>
                    <Badge
                        bg={priorityColors[ticket.priority]}
                        color="white"
                        px={4}
                        py={1.5}
                        borderRadius="full"
                        fontWeight="600"
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.5px"
                        boxShadow="sm"
                    >
                        {priorityLabels[ticket.priority]}
                    </Badge>
                </HStack>

                {/* Metadata Bar */}
                <HStack
                    spacing={6}
                    fontSize="sm"
                    color="gray.600"
                    bg="gray.50"
                    px={4}
                    py={3}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.100"
                >
                    {ticket.assignee && (
                        <HStack spacing={2.5}>
                            <Icon as={FiUser} boxSize="16px" color="gray.500" />
                            <Text fontWeight="500">{ticket.assignee.name}</Text>
                        </HStack>
                    )}
                    {ticket.dueDate && (
                        <HStack spacing={2.5}>
                            <Icon as={FiCalendar} boxSize="16px" color="gray.500" />
                            <Text fontWeight="500">{formatDate(ticket.dueDate)}</Text>
                        </HStack>
                    )}
                    <HStack spacing={2.5}>
                        <Icon as={FiClock} boxSize="16px" color="gray.500" />
                        <Text fontWeight="500">Creato {formatDate(ticket.createdAt)}</Text>
                    </HStack>
                </HStack>

                {/* Descrizione */}
                <Box>
                    <Text fontSize="xs" fontWeight="700" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="0.5px">
                        Descrizione
                    </Text>
                    <Box
                        bg="white"
                        p={4}
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                    >
                        <Text fontSize="sm" color="gray.700" lineHeight="1.7" whiteSpace="pre-wrap">
                            {ticket.description}
                        </Text>
                    </Box>
                </Box>

                {/* Sezione Commenti */}
                <Box pt={2}>
                    <Text fontSize="xs" fontWeight="700" color="gray.500" mb={4} textTransform="uppercase" letterSpacing="0.5px">
                        Attività e Commenti
                    </Text>

                    {/* Timeline Commenti */}
                    <VStack align="stretch" spacing={4} mb={6}>
                        {(!ticket.comments || ticket.comments.length === 0) ? (
                            <Box
                                bg="gradient-to-br from-gray.50 to-gray.100"
                                p={8}
                                borderRadius="xl"
                                textAlign="center"
                                borderWidth="2px"
                                borderStyle="dashed"
                                borderColor="gray.200"
                            >
                                <Text fontSize="sm" color="gray.500" fontWeight="500">
                                    Nessun commento ancora. Sii il primo a commentare!
                                </Text>
                            </Box>
                        ) : (
                            ticket.comments.map((comment) => (
                                <Flex key={comment.id} align="start" spacing={3}>
                                    {/* Avatar */}
                                    <Flex
                                        align="center"
                                        justify="center"
                                        minW="40px"
                                        h="40px"
                                        borderRadius="full"
                                        bg={comment.isSystemMessage ? 'blue.500' : 'black'}
                                        color="white"
                                        fontSize="sm"
                                        fontWeight="700"
                                        mr={3}
                                        boxShadow="md"
                                        flexShrink={0}
                                    >
                                        {getInitials(comment.author.name)}
                                    </Flex>

                                    {/* Comment Content */}
                                    <Box flex={1}>
                                        <HStack spacing={2} mb={1}>
                                            <Text fontSize="sm" fontWeight="600" color="gray.900">
                                                {comment.author.name}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                {formatDate(comment.createdAt)}
                                            </Text>
                                        </HStack>
                                        <Box
                                            bg={comment.isSystemMessage ? 'blue.50' : 'white'}
                                            p={4}
                                            borderRadius="xl"
                                            borderWidth="1px"
                                            borderColor={comment.isSystemMessage ? 'blue.200' : 'gray.200'}
                                            borderLeftWidth="4px"
                                            borderLeftColor={comment.isSystemMessage ? 'blue.500' : 'black'}
                                            boxShadow="sm"
                                            transition="all 0.2s"
                                            _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
                                        >
                                            <Text fontSize="sm" color="gray.700" lineHeight="1.7" whiteSpace="pre-wrap">
                                                {comment.content}
                                            </Text>
                                        </Box>
                                    </Box>
                                </Flex>
                            ))
                        )}
                    </VStack>

                    {/* Input Nuovo Commento */}
                    <Box
                        bg="gray.50"
                        p={5}
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="gray.100"
                    >
                        <Text fontSize="xs" fontWeight="700" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="0.5px">
                            💭 Aggiungi un commento
                        </Text>
                        <VStack align="stretch" spacing={3}>
                            <Textarea
                                placeholder="Scrivi il tuo commento qui..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                minH="120px"
                                borderRadius="xl"
                                borderColor="gray.200"
                                borderWidth="2px"
                                bg="white"
                                _hover={{ borderColor: 'gray.300' }}
                                _focus={{ borderColor: 'black', boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.1)', outline: 'none' }}
                                fontSize="sm"
                                resize="vertical"
                                transition="all 0.2s"
                            />
                            <Flex justify="flex-end">
                                <Button
                                    size="md"
                                    bg="black"
                                    color="white"
                                    _hover={{ bg: 'gray.800', transform: 'translateY(-2px)', boxShadow: 'lg' }}
                                    _active={{ transform: 'translateY(0)', boxShadow: 'md' }}
                                    onClick={handleSubmitComment}
                                    disabled={!newComment.trim() || isSubmitting}
                                    borderRadius="lg"
                                    px={6}
                                    fontWeight="600"
                                    transition="all 0.2s"
                                    boxShadow="md"
                                >
                                    {isSubmitting ? 'Invio...' : 'Invia Commento'}
                                </Button>
                            </Flex>
                        </VStack>
                    </Box>
                </Box>
            </VStack>
        </Modal>
    );
};