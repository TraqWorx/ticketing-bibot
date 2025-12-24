/**
 * PAGE: Ticket Detail
 * 
 * Pagina dettaglio ticket con esperienza mobile-first
 * 
 * Features:
 * - UI app-like mobile
 * - Back button con navigazione
 * - Full screen detail
 * - Smooth scroll
 * - Timeline commenti
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
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
    IconButton,
    Container,
} from '@chakra-ui/react';
import { 
    FiArrowLeft, 
    FiMessageSquare, 
    FiRefreshCw, 
    FiPaperclip, 
    FiX, 
    FiChevronRight,
    FiClock,
    FiMic,
    FiSend,
    FiCalendar,
} from 'react-icons/fi';
import { AsanaTaskDetail } from '@/types';
import { toast } from 'react-toastify';
import { formatDueDate } from '../hooks/useTickets';

// Stile per animazione pulse
const pulseKeyframes = `
@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(1.2);
    }
}
`;

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

export default function TicketDetailPage() {
    const router = useRouter();
    const { id } = router.query;
    
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
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Stati per registrazione audio
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);

    useEffect(() => {
        if (id) {
            loadTaskDetail();
            loadComments();
        }
    }, [id]);

    useEffect(() => {
        if (descriptionRef.current) {
            const contentHeight = descriptionRef.current.scrollHeight;
            setShowExpandButton(contentHeight > 200);
            if (contentHeight <= 200) {
                setIsDescriptionExpanded(true);
            }
        }
    }, [taskDetail]);

    // Auto scroll to bottom SOLO quando vengono aggiunti nuovi commenti (non al primo caricamento)
    // DISABILITATO per evitare glitch di scroll
    // useEffect(() => {
    //     if (comments.length > 0) {
    //         if (isInitialLoadRef.current) {
    //             // Primo caricamento: non fare scroll
    //             isInitialLoadRef.current = false;
    //         } else {
    //             // Nuovi commenti aggiunti: fai scroll
    //             commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    //         }
    //     }
    // }, [comments]);

    const loadTaskDetail = async () => {
        try {
            setLoadingDetail(true);
            const axios = require('axios');
            const response = await axios.get(`/api/asana/task-detail?taskGid=${id}`);
            setTaskDetail(response.data.data);
        } catch (error) {
            console.error('Errore caricamento dettaglio task:', error);
            toast.error('Errore nel caricamento del ticket');
        } finally {
            setLoadingDetail(false);
        }
    };

    const loadComments = async () => {
        try {
            setLoadingComments(true);
            const axios = require('axios');
            const response = await axios.get(`/api/asana/task-stories?taskGid=${id}`);
            const commentStories = (response.data.data || []).filter((story: AsanaStory) => story.type === 'comment');
            setComments(commentStories);
        } catch (error) {
            console.error('Errore caricamento commenti:', error);
        } finally {
            setLoadingComments(false);
        }
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
        
        return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ', ' + 
               d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    };

    // Helper per estrarre priorità dai custom fields Asana
    const getPriorityFromAsana = (taskDetail: AsanaTaskDetail) => {
        const priorityCustomField = taskDetail.custom_fields?.find(
            (cf: any) => cf.name?.toLowerCase() === 'priorità' || cf.name?.toLowerCase() === 'task_priority'
        );
        let priorityValue = (
            priorityCustomField?.display_value || 
            priorityCustomField?.enum_value?.name || 
            'media'
        ).toString().trim().toLowerCase();
        
        if (["alta", "high", "urgente", "urgent"].includes(priorityValue)) {
            return 'urgent';
        } else if (["media", "medium"].includes(priorityValue)) {
            return 'medium';
        } else if (["bassa", "low"].includes(priorityValue)) {
            return 'low';
        }
        return 'medium';
    };

    // Helper per determinare lo stato basato sulla sezione Asana
    const getStatusFromAsana = (taskDetail: AsanaTaskDetail) => {
        const sectionName = taskDetail.memberships?.[0]?.section?.name?.toLowerCase() || '';
        if (sectionName.includes('lavorazione') || sectionName.includes('in progress')) {
            return 'in_progress';
        } else if (sectionName.includes('completati') || sectionName.includes('completed') || sectionName.includes('done')) {
            return 'resolved';
        }
        return 'open';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Timer per mostrare durata registrazione
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Errore avvio registrazione:', error);
            toast.error('Impossibile accedere al microfono');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setAudioBlob(null);
        setRecordingTime(0);
        audioChunksRef.current = [];
    };

    const sendAudioMessage = async () => {
        if (!audioBlob) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('taskGid', id as string);
            
            // Converti il blob in un File con nome appropriato
            const timestamp = Date.now();
            const audioFileName = `nota-vocale-${timestamp}.webm`;
            const audioFile = new File([audioBlob], audioFileName, { 
                type: 'audio/webm' 
            });
            
            formData.append('text', `🎤 Nota vocale: ${audioFileName}`);
            formData.append('attachments', audioFile);

            const axios = require('axios');
            const response = await axios.post('/api/asana/create-story', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Nota vocale inviata!');
            setAudioBlob(null);
            setRecordingTime(0);
            await Promise.all([loadComments(), loadTaskDetail()]);
        } catch (error: any) {
            console.error('Error sending audio:', error);
            const errorMessage = error.response?.data?.message 
                || error.message 
                || 'Errore durante l\'invio della nota vocale';
            toast.error(errorMessage, { autoClose: 5000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('taskGid', id as string);
            formData.append('text', newComment);
            
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

            if (result.attachmentErrors && result.attachmentErrors > 0) {
                toast.warning(
                    `Commento aggiunto, ma ${result.attachmentErrors} allegato/i non caricato/i.`,
                    { autoClose: 5000 }
                );
            } else if (result.attachmentsCount > 0) {
                toast.success(`Commento aggiunto con ${result.attachmentsCount} allegato/i!`);
            } else {
                toast.success('Commento aggiunto!');
            }

            setNewComment('');
            setAttachments([]);
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

    if (loadingDetail) {
        return (
            <Flex justify="center" align="center" minH="100vh" bg="gray.50">
                <VStack gap={3}>
                    <Spinner size="xl" color="black" />
                    <Text fontSize="sm" color="gray.500">Caricamento ticket...</Text>
                </VStack>
            </Flex>
        );
    }

    if (!taskDetail) {
        return (
            <Box minH="100vh" bg="gray.50" p={4}>
                <Container maxW="container.md">
                    <VStack gap={4} py={10}>
                        <Text color="red.500" fontSize="lg" fontWeight="600">
                            Ticket non trovato
                        </Text>
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                        >
                            <HStack gap={2}>
                                <FiArrowLeft />
                                <span>Torna indietro</span>
                            </HStack>
                        </Button>
                    </VStack>
                </Container>
            </Box>
        );
    }

    return (
        <Box minH="100vh" bg="gray.50" pb="180px">
            <style>{pulseKeyframes}</style>
            
            {/* Content scrollabile */}
            <Container maxW="container.md" px={3}>
                <VStack align="stretch" gap={4} pt={{ base: 0, lg: 3 }}>
                    {/* Card Dettaglio Unificata con navigazione integrata */}
                    <Box
                        bg="white"
                        borderRadius="xl"
                        p={4}
                        boxShadow="sm"
                        borderWidth="1px"
                        borderColor="gray.200"
                    >
                        <VStack align="stretch" gap={4}>
                            {/* Navigation + Header in un'unica riga */}
                            <HStack justify="space-between" align="start">
                                <HStack gap={2}>
                                    {/* Bottone Torna indietro sempre visibile, mobile-first */}
                                    <IconButton
                                        aria-label="Torna indietro"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => router.back()}
                                        borderRadius="full"
                                        display={{ base: 'flex' }}
                                        ml={{ base: '-8px', lg: '0' }}
                                        mt={{ base: '-8px', lg: '0' }}
                                    >
                                        <FiArrowLeft />
                                    </IconButton>
                                    <Badge
                                        bg={taskDetail.completed ? 'green.500' : 'gray.400'}
                                        color="white"
                                        px={3}
                                        py={1}
                                        borderRadius="full"
                                        fontSize="xs"
                                        fontWeight="600"
                                    >
                                        {taskDetail.completed ? 'Completato' : 'Non Completato'}
                                    </Badge>
                                </HStack>
                                <HStack gap={2}>
                                    <Text fontSize="xs" color="gray.500" fontWeight="500">
                                        #{taskDetail.gid}
                                    </Text>
                                    <IconButton
                                        aria-label="Aggiorna"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            loadTaskDetail();
                                            loadComments();
                                        }}
                                        loading={loadingComments}
                                        borderRadius="full"
                                    >
                                        <FiRefreshCw />
                                    </IconButton>
                                </HStack>
                            </HStack>

                            {/* Titolo ticket */}
                            <Text fontSize="xl" fontWeight="700" color="gray.900" lineHeight="1.3">
                                {taskDetail.name}
                            </Text>

                            {/* Badge Section */}
                            <HStack gap={2} mt={2} flexWrap="wrap">

                                {/* Badge Priorità */}
                                <Badge
                                    colorScheme={
                                        getPriorityFromAsana(taskDetail) === 'urgent' ? 'red' :
                                        getPriorityFromAsana(taskDetail) === 'medium' ? 'yellow' : 'gray'
                                    }
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                    fontWeight="600"
                                    fontSize="xs"
                                >
                                    Priorità: {
                                        getPriorityFromAsana(taskDetail) === 'urgent' ? 'Urgente' :
                                        getPriorityFromAsana(taskDetail) === 'medium' ? 'Media' : 'Bassa'
                                    }
                                </Badge>

                                {/* Badge Data di Scadenza */}
                                <Badge
                                    colorScheme={formatDueDate(taskDetail.due_on ? new Date(taskDetail.due_on) : undefined).colorScheme}
                                    fontSize="xs"
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                    fontWeight="600"
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                >
                                    <Icon as={FiCalendar} boxSize="12px" />
                                    {formatDueDate(taskDetail.due_on ? new Date(taskDetail.due_on) : undefined).text}
                                </Badge>
                            </HStack>

                            {taskDetail.notes && (
                                <Box
                                    maxH={isDescriptionExpanded ? 'none' : '150px'}
                                    overflowY="hidden"
                                    transition="all 0.3s ease"
                                    position="relative"
                                    ref={descriptionRef}
                                >
                                    <Text fontSize="sm" color="gray.600" lineHeight="1.6">
                                        {taskDetail.notes}
                                    </Text>
                                    {!isDescriptionExpanded && showExpandButton && (
                                        <Box
                                            position="absolute"
                                            bottom="0"
                                            left="0"
                                            right="0"
                                            h="50px"
                                            bg="linear-gradient(transparent, white)"
                                        />
                                    )}
                                </Box>
                            )}

                            {showExpandButton && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    color="blue.500"
                                    fontSize="sm"
                                    fontWeight="600"
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                >
                                    <HStack gap={2}>
                                        <span>{isDescriptionExpanded ? 'Mostra meno' : 'Mostra tutto'}</span>
                                        <Icon 
                                            as={FiChevronRight} 
                                            transform={isDescriptionExpanded ? 'rotate(-90deg)' : 'rotate(90deg)'}
                                            transition="transform 0.2s"
                                        />
                                    </HStack>
                                </Button>
                            )}

                            {/* Allegati */}
                            {taskDetail.attachments && taskDetail.attachments.length > 0 && (
                                <Box pt={2} borderTopWidth="1px" borderTopColor="gray.100">
                                    <Text fontSize="xs" fontWeight="600" color="gray.500" mb={3}>
                                        Allegati ({taskDetail.attachments.length})
                                    </Text>
                                    <VStack gap={2} align="stretch">
                                        {taskDetail.attachments.map((attachment: any, index: number) => (
                                            <HStack
                                                key={attachment.gid}
                                                px={4}
                                                py={3}
                                                bg="gray.50"
                                                borderRadius="lg"
                                                borderWidth="1px"
                                                borderColor="gray.200"
                                                _active={{ bg: 'gray.100' }}
                                                cursor="pointer"
                                                onClick={() => window.open(attachment.download_url || attachment.view_url, '_blank')}
                                                gap={3}
                                            >
                                                <Badge 
                                                    colorScheme="blue" 
                                                    fontSize="xs" 
                                                    borderRadius="full"
                                                    w="24px"
                                                    h="24px"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                >
                                                    {index + 1}
                                                </Badge>
                                                <Icon as={FiPaperclip} color="blue.500" boxSize="18px" />
                                                <Text 
                                                    fontSize="sm" 
                                                    color="gray.700" 
                                                    fontWeight="500"
                                                    flex="1"
                                                    overflow="hidden"
                                                    textOverflow="ellipsis"
                                                    whiteSpace="nowrap"
                                                >
                                                    {attachment.name}
                                                </Text>
                                                <Icon as={FiChevronRight} color="gray.400" boxSize="16px" />
                                            </HStack>
                                        ))}
                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    </Box>

                    {/* Timeline Commenti */}
                    <Box px={1}>
                        <HStack mb={3}>
                            <Icon as={FiMessageSquare} color="gray.500" boxSize="18px" />
                            <Text fontSize="sm" fontWeight="600" color="gray.700">
                                Conversazione ({comments.length})
                            </Text>
                        </HStack>

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
                                    bg="white"
                                    borderRadius="xl"
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                >
                                    <Icon as={FiMessageSquare} boxSize="48px" color="gray.300" />
                                    <VStack gap={1}>
                                        <Text fontSize="md" fontWeight="600" color="gray.500">
                                            Nessun commento
                                        </Text>
                                        <Text fontSize="sm" color="gray.400" textAlign="center" px={4}>
                                            Inizia una conversazione su questo ticket
                                        </Text>
                                    </VStack>
                                </Flex>
                            ) : (
                                comments.map((comment, index) => (
                                    <Box key={comment.gid}>
                                        {/* Divider temporale */}
                                        {(index === 0 || 
                                          new Date(comment.created_at).toDateString() !== 
                                          new Date(comments[index - 1].created_at).toDateString()) && (
                                            <Flex align="center" gap={2} mb={3}>
                                                <Box flex={1} h="1px" bg="gray.200" />
                                                <HStack gap={1} px={2}>
                                                    <Icon as={FiClock} boxSize="12px" color="gray.400" />
                                                    <Text fontSize="xs" color="gray.500" fontWeight="500">
                                                        {new Date(comment.created_at).toLocaleDateString('it-IT', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </Text>
                                                </HStack>
                                                <Box flex={1} h="1px" bg="gray.200" />
                                            </Flex>
                                        )}

                                        <Flex direction="column" align="flex-start" gap={1}>
                                            <HStack gap={2} px={2}>
                                                <Text fontSize="xs" fontWeight="600" color="gray.700">
                                                    {comment.created_by.name}
                                                </Text>
                                                <Text fontSize="xs" color="gray.400">
                                                    {formatDate(new Date(comment.created_at))}
                                                </Text>
                                            </HStack>

                                            <Box
                                                bg="#DCF8C6"
                                                borderWidth="1px"
                                                borderColor="#B8E2A0"
                                                borderRadius="2xl"
                                                borderTopLeftRadius="md"
                                                p={4}
                                                maxW="85%"
                                            >
                                                <Text fontSize="sm" color="gray.800" lineHeight="1.6" whiteSpace="pre-wrap">
                                                    {comment.text}
                                                </Text>
                                            </Box>
                                        </Flex>
                                    </Box>
                                ))
                            )}
                            <div ref={commentsEndRef} />
                        </VStack>
                    </Box>
                </VStack>

                {/* Spacer per evitare che l'ultimo messaggio sia coperto dall'input box */}
                <Box h="180px" />
            </Container>

            {/* Input box fisso in basso - fixed ma centrato nel container */}
            <Box
                position="fixed"
                bottom={0}
                left={{ base: 0, lg: '260px' }}
                right={0}
                bg="white"
                borderTopWidth="1px"
                borderTopColor="gray.200"
                boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
                zIndex={10}
                py={3}
            >
                <Container maxW="container.md" px={3}>
                    <Box>
                    {attachments.length > 0 && (
                        <HStack gap={2} mb={2} flexWrap="wrap" pb={2} borderBottomWidth="1px" borderBottomColor="gray.100">
                            {attachments.map((file, index) => (
                                <Badge
                                    key={index}
                                    colorScheme="blue"
                                    display="flex"
                                    alignItems="center"
                                    gap={1}
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                    fontSize="xs"
                                >
                                    <Icon as={FiPaperclip} boxSize="10px" />
                                    <Text 
                                        maxW="120px"
                                        overflow="hidden"
                                        textOverflow="ellipsis"
                                        whiteSpace="nowrap"
                                    >
                                        {file.name}
                                    </Text>
                                    <Icon
                                        as={FiX}
                                        boxSize="12px"
                                        cursor="pointer"
                                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                                    />
                                </Badge>
                            ))}
                        </HStack>
                    )}

                    <HStack gap={2} align="flex-end">
                        {/* Mostra anteprima audio se disponibile */}
                        {audioBlob ? (
                            <>
                                <Box
                                    flex={1}
                                    bg="gray.50"
                                    borderRadius="xl"
                                    borderWidth="1px"
                                    borderColor="gray.300"
                                    p={3}
                                >
                                    <HStack gap={3} justify="space-between">
                                        <HStack gap={2} flex={1}>
                                            <Icon as={FiMic} boxSize="20px" color="#25D366" />
                                            <VStack align="flex-start" gap={0} flex={1}>
                                                <Text fontSize="sm" fontWeight="600" color="gray.700">
                                                    Nota vocale
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    {formatRecordingTime(recordingTime)}
                                                </Text>
                                            </VStack>
                                            <audio 
                                                src={URL.createObjectURL(audioBlob)} 
                                                controls 
                                                style={{ 
                                                    height: '32px',
                                                    flex: 1,
                                                    maxWidth: '200px'
                                                }}
                                            />
                                        </HStack>
                                        <IconButton
                                            aria-label="Elimina audio"
                                            variant="ghost"
                                            size="sm"
                                            onClick={cancelRecording}
                                            borderRadius="full"
                                            color="red.500"
                                        >
                                            <FiX />
                                        </IconButton>
                                    </HStack>
                                </Box>
                                <IconButton
                                    aria-label="Invia nota vocale"
                                    bg="#25D366"
                                    color="white"
                                    _hover={{ bg: "#20BA5A" }}
                                    _active={{ bg: "#1DA851" }}
                                    size="lg"
                                    onClick={sendAudioMessage}
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                    borderRadius="full"
                                    flexShrink={0}
                                >
                                    <Icon as={FiSend} boxSize="20px" />
                                </IconButton>
                            </>
                        ) : isRecording ? (
                            <>
                                <Box
                                    flex={1}
                                    bg="red.50"
                                    borderRadius="xl"
                                    borderWidth="1px"
                                    borderColor="red.300"
                                    p={3}
                                >
                                    <HStack gap={3}>
                                        <Box
                                            w="12px"
                                            h="12px"
                                            borderRadius="full"
                                            bg="red.500"
                                            animation="pulse 1.5s ease-in-out infinite"
                                        />
                                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                                            Registrazione in corso...
                                        </Text>
                                        <Text fontSize="sm" fontWeight="700" color="red.500" ml="auto">
                                            {formatRecordingTime(recordingTime)}
                                        </Text>
                                    </HStack>
                                </Box>
                                <IconButton
                                    aria-label="Annulla registrazione"
                                    variant="ghost"
                                    size="lg"
                                    onClick={cancelRecording}
                                    borderRadius="full"
                                    flexShrink={0}
                                    color="red.500"
                                >
                                    <FiX />
                                </IconButton>
                                <IconButton
                                    aria-label="Ferma registrazione"
                                    bg="red.500"
                                    color="white"
                                    _hover={{ bg: "red.600" }}
                                    _active={{ bg: "red.700" }}
                                    size="lg"
                                    onClick={stopRecording}
                                    borderRadius="full"
                                    flexShrink={0}
                                >
                                    <Icon as={FiMic} boxSize="20px" />
                                </IconButton>
                            </>
                        ) : (
                            <>
                                <IconButton
                                    aria-label="Allega file"
                                    variant="ghost"
                                    size="md"
                                    onClick={() => document.getElementById('mobile-attachment-input')?.click()}
                                    disabled={taskDetail.completed}
                                    borderRadius="full"
                                    flexShrink={0}
                                >
                                    <FiPaperclip />
                                </IconButton>
                                <input
                                    id="mobile-attachment-input"
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
                                
                                <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={taskDetail.completed ? "Ticket completato" : "Scrivi un messaggio..."}
                                    bg="gray.50"
                                    borderColor="gray.300"
                                    borderRadius="xl"
                                    _hover={{ borderColor: 'gray.400', bg: 'white' }}
                                    _focus={{ borderColor: '#25D366', bg: 'white', boxShadow: '0 0 0 1px #25D366' }}
                                    resize="none"
                                    minH="44px"
                                    maxH="120px"
                                    fontSize="sm"
                                    disabled={taskDetail.completed}
                                    flex={1}
                                    py={3}
                                />
                                
                                {/* Due pulsanti separati: invio e microfono */}
                                <IconButton
                                    aria-label="Invia messaggio"
                                    bg="#25D366"
                                    color="white"
                                    _hover={{ bg: "#20BA5A" }}
                                    _active={{ bg: "#1DA851" }}
                                    size="lg"
                                    onClick={handleSubmitComment}
                                    loading={isSubmitting}
                                    disabled={(!newComment.trim() && attachments.length === 0) || taskDetail.completed}
                                    borderRadius="full"
                                    flexShrink={0}
                                >
                                    <Icon as={FiSend} boxSize="20px" />
                                </IconButton>

                                <IconButton
                                    aria-label="Registra nota vocale"
                                    bg="gray.100"
                                    color="gray.600"
                                    _hover={{ bg: "gray.200" }}
                                    _active={{ bg: "gray.300" }}
                                    size="lg"
                                    onClick={startRecording}
                                    disabled={taskDetail.completed}
                                    borderRadius="full"
                                    flexShrink={0}
                                >
                                    <Icon as={FiMic} boxSize="20px" />
                                </IconButton>
                            </>
                        )}
                    </HStack>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
