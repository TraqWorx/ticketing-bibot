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

import { useState, useEffect, useRef } from 'react';
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
    Spinner,
} from '@chakra-ui/react';
import { FiCalendar, FiUser, FiClock, FiMessageSquare, FiRefreshCw, FiPaperclip, FiX, FiChevronRight } from 'react-icons/fi';
import { Ticket } from '../types';
import { Modal } from '@/components/Modal';
import { AsanaTaskDetail } from '@/types';
import { toast } from 'react-toastify';

interface AsanaStory {
    gid: string;
    created_at: string;
    created_by: {
        gid: string;
        name: string;
    };
    text: string;
    type: string;
}

interface TicketDetailModalProps {
    ticket: Ticket;
    isOpen: boolean;
    onClose: () => void;
    onAddComment?: (content: string) => void;
}

export const TicketDetailModal = ({ ticket, isOpen, onClose }: TicketDetailModalProps) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taskDetail, setTaskDetail] = useState<AsanaTaskDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [comments, setComments] = useState<AsanaStory[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showExpandButton, setShowExpandButton] = useState(false);
    const descriptionRef = useRef<HTMLDivElement>(null);

    // Carica dettaglio task quando si apre la modale
    useEffect(() => {
        if (isOpen && ticket.id) {
            loadTaskDetail();
            loadComments();
        }
    }, [isOpen, ticket.id]);

    // Controlla se il contenuto della descrizione supera 200px
    useEffect(() => {
        if (descriptionRef.current) {
            // Misura l'altezza del contenuto
            const contentHeight = descriptionRef.current.scrollHeight;
            // Se il contenuto è lungo, mostra il pulsante di espansione
            setShowExpandButton(contentHeight > 200);
            // Se il contenuto è corto, mantienilo sempre visibile (espanso)
            if (contentHeight <= 200) {
                setIsDescriptionExpanded(true);
            }
        }
    }, [taskDetail]);

    const loadTaskDetail = async () => {
        try {
            setLoadingDetail(true);
            const axios = require('axios');
            const response = await axios.get(`/api/asana/task-detail?taskGid=${ticket.id}`);
            setTaskDetail(response.data.data);
        } catch (error) {
            console.error('Errore caricamento dettaglio task:', error);
        } finally {
            setLoadingDetail(false);
        }
    };

    const loadComments = async () => {
        try {
            setLoadingComments(true);
            const axios = require('axios');
            const response = await axios.get(`/api/asana/task-stories?taskGid=${ticket.id}`);
            
            // Filtra solo i commenti (type === 'comment')
            const commentStories = (response.data.data || []).filter((story: AsanaStory) => story.type === 'comment');
            setComments(commentStories);
        } catch (error) {
            console.error('Errore caricamento commenti:', error);
        } finally {
            setLoadingComments(false);
        }
    };

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

        // Se è in giornata (meno di 24 ore)
        if (diffMins < 1) return 'Adesso';
        if (diffMins < 60) return `${diffMins} min fa`;
        if (diffHours < 24) return `${diffHours} ore fa`;
        
        // Se è più di 24 ore, mostra data e ora
        return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ', ' + 
               d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
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
            // Prepara FormData per includere file
            const formData = new FormData();
            formData.append('taskGid', ticket.id);
            formData.append('text', newComment);
            
            // Aggiungi tutti gli allegati
            attachments.forEach((file) => {
                formData.append('attachments', file);
            });

            const axios = require('axios');
            const response = await axios.post('/api/asana/create-story', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const result = response.data;

            // Mostra successo con informazioni sugli allegati
            if (result.attachmentErrors && result.attachmentErrors > 0) {
                toast.warning(
                    `Commento aggiunto, ma ${result.attachmentErrors} allegato/i non caricato/i.`,
                    { autoClose: 5000 }
                );
            } else if (result.attachmentsCount > 0) {
                toast.success(`Commento aggiunto con ${result.attachmentsCount} allegato/i!`);
            } else {
                toast.success('Commento aggiunto con successo!');
            }

            setNewComment('');
            setAttachments([]);

            // Ricarica i commenti e il dettaglio per mostrare i nuovi allegati
            await Promise.all([loadComments(), loadTaskDetail()]);
        } catch (error: any) {
            console.error('Error adding comment:', error);
            const errorMessage = error.response?.data?.message 
                || error.message 
                || 'Errore durante l\'invio del commento';
            toast.error(errorMessage, { autoClose: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Dettaglio Ticket"
            size="xl"
        >
            {loadingDetail ? (
                <Flex justify="center" align="center" py={10}>
                    <Spinner size="lg" color="black" />
                </Flex>
            ) : !taskDetail ? (
                <Box py={10} textAlign="center">
                    <Text color="red.500">Errore nel caricamento del dettaglio</Text>
                </Box>
            ) : (
                <>
                    <HStack gap={2} mb={3}>
                        <Badge
                            bg={taskDetail.completed ? 'green.500' : 'blue.400'}
                            color="white"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontWeight="600"
                            fontSize="xs"
                        >
                            {taskDetail.completed ? 'Completato' : 'Aperto'}
                        </Badge>
                        <Badge
                            colorScheme={
                                ticket.priority === 'urgent' || ticket.priority === 'high' ? 'red' :
                                ticket.priority === 'medium' ? 'blue' : 'gray'
                            }
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontWeight="600"
                            fontSize="xs"
                        >
                            Priorità: {
                                ticket.priority === 'urgent' || ticket.priority === 'high' ? 'Alta' :
                                ticket.priority === 'medium' ? 'Media' : 'Bassa'
                            }
                        </Badge>
                        <Text fontSize="xs" color="gray.500" fontWeight="500">
                            Ticket #{taskDetail.gid}
                        </Text>
                    </HStack>
                    <Flex direction="column" h={{ base: 'calc(100vh - 120px)', md: '600px' }}>
                        {/* Header Info Collassabile */}
                        <Box
                            bg="gray.50"
                            p={4}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="gray.200"
                            mb={4}
                            maxH={isDescriptionExpanded ? 'none' : '200px'}
                            overflowY="hidden"
                            transition="all 0.3s ease"
                            position="relative"
                        >
                            <VStack align="stretch" gap={3} ref={descriptionRef}>
                                <Text fontSize="lg" fontWeight="700" color="gray.900">
                                    {taskDetail.name}
                                </Text>
                                {taskDetail.notes && (
                                    <Text fontSize="sm" color="gray.600" lineHeight="1.5">
                                        {taskDetail.notes}
                                    </Text>
                                )}
                                
                                {/* Allegati del Task */}
                                {taskDetail.attachments && taskDetail.attachments.length > 0 && (
                                    <Box mt={2}>
                                        <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2}>
                                            Allegati ({taskDetail.attachments.length})
                                        </Text>
                                        <HStack gap={2} flexWrap="wrap">
                                            {taskDetail.attachments.map((attachment: any, index: number) => (
                                                <HStack
                                                    key={attachment.gid}
                                                    px={3}
                                                    py={2}
                                                    bg="white"
                                                    borderRadius="md"
                                                    borderWidth="1px"
                                                    borderColor="gray.200"
                                                    _hover={{ borderColor: 'blue.400', bg: 'blue.50' }}
                                                    cursor="pointer"
                                                    onClick={() => window.open(attachment.download_url || attachment.view_url, '_blank')}
                                                    w="200px"
                                                    h="40px"
                                                    title={attachment.name}
                                                    gap={2}
                                                >
                                                    <Badge 
                                                        colorScheme="blue" 
                                                        fontSize="10px" 
                                                        borderRadius="full"
                                                        minW="20px"
                                                        h="20px"
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                        flexShrink={0}
                                                    >
                                                        {index + 1}
                                                    </Badge>
                                                    <Icon as={FiPaperclip} color="blue.500" boxSize="14px" flexShrink={0} />
                                                    <Text 
                                                        fontSize="sm" 
                                                        color="blue.600" 
                                                        fontWeight="500"
                                                        whiteSpace="nowrap"
                                                        overflow="hidden"
                                                        textOverflow="ellipsis"
                                                        flex="1"
                                                        minW="0"
                                                    >
                                                        {attachment.name}
                                                    </Text>
                                                </HStack>
                                            ))}
                                        </HStack>
                                    </Box>
                                )}
                            </VStack>
                            
                            {/* Pulsante Espandi/Riduci se il contenuto è troppo lungo */}
                            {!isDescriptionExpanded && showExpandButton && (
                                <Flex
                                    position="absolute"
                                    bottom="0"
                                    left="0"
                                    right="0"
                                    h="60px"
                                    bg="linear-gradient(transparent, rgba(249, 250, 251, 0.95))"
                                    align="flex-end"
                                    justify="center"
                                    pb={2}
                                >
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        color="gray.600"
                                        fontSize="xs"
                                        fontWeight="600"
                                        onClick={() => setIsDescriptionExpanded(true)}
                                    >
                                        <HStack gap={1}>
                                            <Text>Mostra tutto</Text>
                                            <Icon as={FiChevronRight} transform="rotate(90deg)" />
                                        </HStack>
                                    </Button>
                                </Flex>
                            )}
                            
                            {/* Pulsante Riduci se espanso */}
                            {isDescriptionExpanded && showExpandButton && (
                                <Flex justify="center" mt={3}>
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        color="gray.600"
                                        fontSize="xs"
                                        fontWeight="600"
                                        onClick={() => setIsDescriptionExpanded(false)}
                                    >
                                        <HStack gap={1}>
                                            <Text>Riduci</Text>
                                            <Icon as={FiChevronRight} transform="rotate(-90deg)" />
                                        </HStack>
                                    </Button>
                                </Flex>
                            )}
                        </Box>

                        {/* Area Chat Scrollabile */}
                        <Box
                        flex="1"
                        minH="200px"
                        overflowY="auto"
                            mb={4}
                            px={2}
                            css={{
                                '&::-webkit-scrollbar': {
                                    width: '6px',
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: '#f1f1f1',
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    background: '#888',
                                    borderRadius: '10px',
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                    background: '#555',
                                },
                            }}
                        >
                            <VStack align="stretch" gap={3}>
                                {loadingComments ? (
                                    <Flex justify="center" py={8}>
                                        <Spinner size="md" color="gray.400" />
                                    </Flex>
                                ) : comments.length === 0 ? (
                                    <Flex
                                        justify="center"
                                        align="center"
                                        py={12}
                                        direction="column"
                                        gap={3}
                                    >
                                        <Icon as={FiMessageSquare} boxSize="48px" color="gray.300" />
                                        <VStack gap={1}>
                                            <Text fontSize="md" fontWeight="600" color="gray.500">
                                                Nessun commento
                                            </Text>
                                            <Text fontSize="sm" color="gray.400">
                                                Inizia una conversazione su questo ticket
                                            </Text>
                                        </VStack>
                                    </Flex>
                                ) : (
                                    comments.map((comment) => (
                                        <Flex
                                            key={comment.gid}
                                            direction="column"
                                            align="flex-start"
                                            gap={1}
                                        >
                                            {/* Nome e timestamp */}
                                            <HStack gap={2} px={2}>
                                                <Text fontSize="xs" fontWeight="600" color="gray.700">
                                                    {comment.created_by.name}
                                                </Text>
                                                <Text fontSize="xs" color="gray.400">
                                                    {formatDate(new Date(comment.created_at))}
                                                </Text>
                                            </HStack>

                                            {/* Bubble messaggio */}
                                            <Box
                                                bg="green.50"
                                                borderWidth="1px"
                                                borderColor="green.200"
                                                borderRadius="lg"
                                                borderTopLeftRadius="4px"
                                                p={3}
                                                maxW="85%"
                                                boxShadow="sm"
                                            >
                                                <Text fontSize="sm" color="gray.800" lineHeight="1.5" whiteSpace="pre-wrap">
                                                    {comment.text}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    ))
                                )}
                            </VStack>
                        </Box>

                        {/* Input Messaggio Fisso in Basso */}
                        <Box
                            borderTop="1px"
                            borderColor="gray.200"
                            pt={3}
                            pb={4}
                            bg="white"
                        >
                            <HStack gap={2} mb={2} justify="space-between">
                                <HStack gap={2}>
                                    <Icon as={FiMessageSquare} color="gray.500" boxSize="16px" />
                                    <Text fontSize="xs" fontWeight="600" color="gray.600">
                                        {comments.length} commenti
                                    </Text>
                                </HStack>

                                <Button
                                    size="xs"
                                    variant="ghost"
                                    color="gray.500"
                                    onClick={loadComments}
                                    loading={loadingComments}
                            >
                                <Icon as={FiRefreshCw} mr={1} />
                                Aggiorna
                                </Button>
                            </HStack>

                            <VStack gap={2}>
                                <Box position="relative" w="100%">
                                    <Textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={taskDetail.completed ? "Ticket completato - non e' possibile inviare commenti" : "Scrivi un commento..."}
                                        bg="gray.50"
                                        borderColor="gray.300"
                                        borderRadius="xl"
                                        _hover={{ borderColor: 'gray.400', bg: 'white' }}
                                        _focus={{ borderColor: 'green.500', bg: 'white', boxShadow: '0 0 0 1px #22c55e' }}
                                        resize="none"
                                        rows={3}
                                        fontSize="sm"
                                        disabled={taskDetail.completed}
                                        pr="40px"
                                    />
                                    <Button
                                        position="absolute"
                                        right="8px"
                                        bottom="8px"
                                        size="sm"
                                        variant="ghost"
                                        color="gray.500"
                                        _hover={{ color: 'gray.700', bg: 'gray.100' }}
                                        onClick={() => document.getElementById('comment-attachment-input')?.click()}
                                        disabled={taskDetail.completed}
                                        p={2}
                                        minW="auto"
                                        h="32px"
                                    >
                                        <Icon as={FiPaperclip} boxSize="18px" />
                                    </Button>
                                    <input
                                        id="comment-attachment-input"
                                        type="file"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const files = e.target.files;
                                            if (files) {
                                                setAttachments(prev => [...prev, ...Array.from(files)]);
                                            }
                                        }}
                                        disabled={taskDetail.completed}
                                    />
                                </Box>
                                
                                {/* Mostra allegati selezionati */}
                                {attachments.length > 0 && (
                                    <HStack gap={2} w="100%" flexWrap="wrap">
                                        {attachments.map((file, index) => (
                                            <Badge
                                                key={index}
                                                colorScheme="blue"
                                                display="flex"
                                                alignItems="center"
                                                gap={1}
                                                px={2}
                                                py={1}
                                            >
                                                <Icon as={FiPaperclip} boxSize="12px" />
                                                <Text fontSize="xs">{file.name}</Text>
                                                <Icon
                                                    as={FiX}
                                                    boxSize="14px"
                                                    cursor="pointer"
                                                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                                />
                                            </Badge>
                                        ))}
                                    </HStack>
                                )}
                                
                                <Flex justify="flex-end" w="100%" mt={2}>
                                    <Button
                                        size="sm"
                                        bg="green.500"
                                        color="white"
                                        _hover={{ bg: 'green.600' }}
                                        _active={{ bg: 'green.700' }}
                                        onClick={handleSubmitComment}
                                        loading={isSubmitting}
                                        disabled={!newComment.trim() || taskDetail.completed}
                                        borderRadius="xl"
                                        px={6}
                                >
                                    <Icon as={FiMessageSquare} mr={1} />
                                    Invia
                                    </Button>
                                </Flex>
                            </VStack>
                        </Box>
                    </Flex>
                </>
            )}
        </Modal>
    );
};

