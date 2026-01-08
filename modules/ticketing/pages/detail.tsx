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

import { AsanaTaskDetail } from '@/types';
import axios from '@/utils/axios';
import { sendTicketReopenedEvent } from '@/lib/ghl/ghlService';
import { renderTextWithLinks } from '@/utils/commonUtils';
import {
    Badge,
    Box,
    Button,
    Container,
    Flex,
    HStack,
    Icon,
    IconButton,
    Link,
    Spinner,
    Text,
    Textarea,
    VStack,
    useBreakpointValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import {
    FiArrowLeft,
    FiCalendar,
    FiChevronRight,
    FiClock,
    FiMessageSquare,
    FiMic,
    FiPaperclip,
    FiRefreshCw,
    FiSend,
    FiX,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { formatDueDate } from '../hooks/useTickets';
import { upload } from '@vercel/blob/client';

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
    const isMobile = useBreakpointValue({ base: true, md: false });

    // Funzione per determinare la route corretta per tornare indietro
    const getBackRoute = () => {
        return '/clienti/ticketing';
    };

    const handleGoBack = () => {
        router.push(getBackRoute());
    };

    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [taskDetail, setTaskDetail] = useState<AsanaTaskDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [comments, setComments] = useState<AsanaStory[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showExpandButton, setShowExpandButton] = useState(false);
    const [isAttachmentsExpanded, setIsAttachmentsExpanded] = useState(false);
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

    // Stato per l'utente Asana corrente (account tecnico)
    const [currentAsanaUser, setCurrentAsanaUser] = useState<{ gid: string; name: string; email: string } | null>(null);

    // Stato per i dati Firestore del ticket
    const [firestoreData, setFirestoreData] = useState<any>(null);
    const [loadingFirestore, setLoadingFirestore] = useState(false);

    // Stati per gestione errori
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (id) {
            loadTaskDetail();
            loadComments();
            loadFirestoreData();
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

    const loadTaskDetail = async () => {
        try {
            setLoadingDetail(true);
            setError(false);
            setErrorMessage('');
            const response = await axios.get(`/api/asana/task-detail?taskGid=${id}`);
            setTaskDetail(response.data.data);
        } catch (error: any) {
            console.error('Errore caricamento dettaglio task:', error);
            const errorMsg = error?.response?.data?.message || error?.message || 'Errore nel caricamento del ticket';
            setError(true);
            setErrorMessage(`Errore caricamento ticket: ${errorMsg}`);
            toast.error('Errore nel caricamento del ticket');
        } finally {
            setLoadingDetail(false);
        }
    };

    const loadComments = async () => {
        try {
            setLoadingComments(true);
            const response = await axios.get(`/api/asana/task-stories?taskGid=${id}`);
            const commentStories = (response.data.data || []).filter((story: AsanaStory) => story.type === 'comment');
            setComments(commentStories);

            // Carica l'utente tecnico solo se ci sono commenti
            if (commentStories.length > 0) {
                loadCurrentAsanaUser();
            }
        } catch (error: any) {
            console.error('Errore caricamento commenti:', error);
            // Non impostare errore globale per commenti - sono secondari
            toast.error('Errore nel caricamento dei commenti');
        } finally {
            setLoadingComments(false);
        }
    };

    const loadCurrentAsanaUser = async () => {
        try {
            // Controlla prima se l'utente tecnico è già salvato nel localStorage
            const cachedUser = localStorage.getItem('techUser');
            if (cachedUser) {
                try {
                    setCurrentAsanaUser(JSON.parse(cachedUser));
                    return;
                } catch (parseError) {
                    // Se c'è un errore nel parsing, rimuovi il dato corrotto e procedi con la chiamata API
                    localStorage.removeItem('techUser');
                }
            }

            // Se non c'è in cache, fai la chiamata API
            const response = await axios.get('/api/asana/tech-user');
            setCurrentAsanaUser(response.data);

            // Salva il risultato nel localStorage per le prossime volte
            localStorage.setItem('techUser', JSON.stringify(response.data));
        } catch (error) {
            console.error('Errore caricamento utente Asana corrente:', error);
            setCurrentAsanaUser(null);
        }
    };

    const loadFirestoreData = async () => {
        try {
            setLoadingFirestore(true);
            const response = await axios.get(`/api/tickets/${id}`);

            // Gestisci la nuova struttura della risposta
            if (response.data?.exists === false) {
                // Ticket non esiste su Firestore, ma non è un errore critico
                setFirestoreData(null);
            } else if (response.data?.ticket) {
                setFirestoreData(response.data.ticket);
            } else {
                // Retrocompatibilità: se la risposta è nel vecchio formato
                setFirestoreData(response.data);
            }
        } catch (error: any) {
            console.error('Errore caricamento dati Firestore:', error);
            // Non impostare errore globale per Firestore - sono dati secondari
            setFirestoreData(null);
        } finally {
            setLoadingFirestore(false);
        }
    };

    const retryLoadData = async () => {
        setError(false);
        setErrorMessage('');
        await loadTaskDetail();
        await loadComments();
        await loadFirestoreData();
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

    // Helper per estrarre clientId dai custom fields Asana
    const getClientIdFromAsana = (taskDetail: AsanaTaskDetail) => {
        const clientIdField = taskDetail.custom_fields?.find(
            (cf: any) => cf.name?.toLowerCase() === 'client_id' ||
                cf.name?.toLowerCase() === 'cliente_id' ||
                cf.name?.toLowerCase() === 'user_id'
        );
        return clientIdField?.display_value || clientIdField?.text_value || null;
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

        if (["urgente", "urgent"].includes(priorityValue)) {
            return 'urgent';
        } else if (["alta", "high"].includes(priorityValue)) {
            return 'high';
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
            return 'completed';
        }
        return 'open';
    };

    const startRecording = async () => {
        try {
            // Verifica contesto sicuro per getUserMedia
            const isSecureContext = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            if (!isSecureContext) {
                toast.error('La registrazione vocale richiede un contesto sicuro (HTTPS)');
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
                toast.error('Registrazione vocale non supportata su questo dispositivo/browser');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Rileva il formato audio supportato dal browser
            // Safari/iOS supportano audio/mp4, altri browser audio/webm
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
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
            toast.error((error instanceof Error ? error.message : 'Impossibile accedere al microfono. Verifica i permessi del browser e che il sito sia sicuro (HTTPS).'));
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
            // Converti il blob audio in base64
            const timestamp = Date.now();
            const audioFileName = `nota-vocale-${timestamp}.webm`;

            // Leggi il blob come ArrayBuffer e convertilo in base64
            const arrayBuffer = await audioBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            let binaryString = '';
            for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
            }
            const buffer = btoa(binaryString);

            // Invia direttamente al backend senza passare per Vercel Blob
            const response = await axios.post('/api/asana/create-story', {
                taskGid: id as string,
                text: `🎤 Nota vocale: ${audioFileName}`,
                audioFile: {
                    buffer: buffer,
                    filename: audioFileName,
                    mimetype: audioBlob.type || 'audio/webm'
                }
            });

            setAudioBlob(null);
            setRecordingTime(0);
            await Promise.all([loadComments(), loadTaskDetail()]);

            toast.success('Nota vocale inviata con successo');
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
            // STEP 1: Upload file direttamente su Vercel Blob Storage (client-side)
            const blobUrls: string[] = [];

            if (attachments.length > 0) {
                for (const file of attachments) {
                    try {
                        // Genera nome file univoco per evitare conflitti
                        const randomSuffix = Math.random().toString(36).substring(2, 15);
                        const fileExtension = file.name.match(/\.[^/.]+$/)?.[0] || '';
                        const baseName = file.name.replace(/\.[^/.]+$/, '');
                        // Sanitizza il nome file: sostituisci spazi con trattini e rimuovi caratteri speciali
                        const sanitizedBaseName = baseName
                            .replace(/\s+/g, '-') // spazi -> trattini
                            .replace(/[^\w-]/g, '') // rimuovi caratteri speciali (mantieni lettere, numeri, underscore, trattini)
                            .replace(/-+/g, '-') // trattini multipli -> singolo trattino
                            .replace(/^-|-$/g, ''); // rimuovi trattini iniziali/finali
                        const uniqueFileName = `${sanitizedBaseName}_${randomSuffix}${fileExtension}`;

                        const blob = await upload(uniqueFileName, file, {
                            access: 'public',
                            handleUploadUrl: '/api/blob/upload',
                        });

                        blobUrls.push(blob.url);
                    } catch (uploadError) {
                        console.error('Errore upload file su blob:', uploadError);
                        toast.error(`Errore caricamento file: ${file.name}`);
                    }
                }
            }

            // STEP 2: Invia solo i riferimenti URL al backend
            const response = await axios.post('/api/asana/create-story', {
                taskGid: id as string,
                text: newComment,
                attachmentUrls: blobUrls,
            });

            const result = response.data;

            if (result.attachmentErrors && result.attachmentErrors > 0) {
                toast.warning(
                    `Commento aggiunto, ma allegati non caricati.`,
                    { autoClose: 5000 }
                );
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

    const handleReopenTicket = async () => {
        try {
            const response = await axios.put('/api/asana/update-task', {
                taskGid: id as string,
                updates: { completed: false },
            });

            if (response.data.success) {
                toast.success('Ticket riaperto con successo');
                await loadTaskDetail();

                // Invia evento a GHL per workflow di riapertura
                const clientId = taskDetail ? getClientIdFromAsana(taskDetail) : null;

                if (clientId && firestoreData?.ghlContactId) {
                    try {
                        await sendTicketReopenedEvent({
                            clientId,
                            ghlContactId: firestoreData.ghlContactId,
                            ticketId: id as string,
                            reopenedBy: 'admin',
                        });
                    } catch (ghlError) {
                        console.error('Errore invio evento GHL riapertura ticket:', ghlError);
                        // Non bloccare il flusso se GHL fallisce
                    }
                } else {
                    console.warn('Impossibile inviare evento GHL: dati mancanti', {
                        hasClientId: !!clientId,
                        hasFirestoreData: !!firestoreData,
                        hasGhlContactId: !!firestoreData?.ghlContactId
                    });
                }
            } else {
                // Caso in cui il backend ritorna success: false
                toast.error(response.data.message || 'Errore durante la riapertura del ticket');
            }
        } catch (error: any) {
            console.error('Errore riapertura ticket:', error);
            toast.error(`Errore durante la riapertura del ticket`);
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
                            onClick={handleGoBack}
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

    if (error) {
        return (
            <Box minH="100vh" bg="gray.50" p={4}>
                <Container maxW="container.md">
                    <VStack gap={4} py={10}>
                        <Icon as={FiX} boxSize={12} color="red.500" />
                        <Text color="red.500" fontSize="lg" fontWeight="600" textAlign="center">
                            Errore nel caricamento
                        </Text>
                        <Text color="gray.600" fontSize="sm" textAlign="center" maxW="400px">
                            {errorMessage || 'Si è verificato un errore durante il caricamento del ticket.'}
                        </Text>
                        <HStack gap={3}>
                            <Button
                                onClick={retryLoadData}
                                colorScheme="blue"
                                loading={loadingDetail}
                            >
                                <HStack gap={2}>
                                    <FiRefreshCw />
                                    <span>Riprova</span>
                                </HStack>
                            </Button>
                            <Button
                                onClick={handleGoBack}
                                variant="outline"
                            >
                                <HStack gap={2}>
                                    <FiArrowLeft />
                                    <span>Torna indietro</span>
                                </HStack>
                            </Button>
                        </HStack>
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
                            <Flex
                                direction={{ base: 'column', md: 'row' }}
                                gap={{ base: 3, md: 0 }}
                                justify={{ md: 'space-between' }}
                                align={{ md: 'start' }}
                            >
                                {/* Su mobile: prima riga con freccia e aggiorna */}
                                <Flex
                                    justify="space-between"
                                    align="center"
                                    display={{ base: 'flex', md: 'none' }}
                                >
                                    <IconButton
                                        aria-label="Torna indietro"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGoBack}
                                        borderRadius="full"
                                        ml={{ base: '-8px' }}
                                        mt={{ base: '-8px' }}
                                    >
                                        <FiArrowLeft />
                                    </IconButton>
                                    <HStack gap={1} align="center">
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
                                </Flex>

                                {/* Badge e pulsante riapri */}
                                <HStack gap={2} align="center">
                                    {/* Bottone Torna indietro visibile solo su desktop */}
                                    <IconButton
                                        aria-label="Torna indietro"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleGoBack}
                                        borderRadius="full"
                                        display={{ base: 'none', md: 'flex' }}
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
                                        h="24px"
                                        display="flex"
                                        alignItems="center"
                                    >
                                        {taskDetail.completed ? 'Completato' : 'Non Completato'}
                                    </Badge>
                                    {taskDetail.completed && (
                                        <Button
                                            size="xs"
                                            colorScheme="blue"
                                            variant="outline"
                                            onClick={handleReopenTicket}
                                            borderRadius="full"
                                            fontSize="xs"
                                            fontWeight="600"
                                            _hover={{ bg: 'blue.50' }}
                                            h="24px"
                                        >
                                            <Icon as={FiRefreshCw} mr={1} />
                                            Riapri ticket
                                        </Button>
                                    )}
                                </HStack>

                                {/* ID ticket e aggiorna su desktop */}
                                <HStack gap={2} align="center" display={{ base: 'none', md: 'flex' }}>
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
                            </Flex>

                            {/* Titolo ticket */}
                            <Text fontSize="xl" fontWeight="700" color="gray.900" lineHeight="1.3">
                                {taskDetail.name}
                            </Text>

                            {/* Badge Section */}
                            <HStack gap={2} mt={2} flexWrap="wrap">

                                {/* Badge Priorità */}
                                <Badge
                                    bg={getPriorityBg(getPriorityFromAsana(taskDetail))}
                                    color={getPriorityColor(getPriorityFromAsana(taskDetail))}
                                    px={{ base: 2, md: 3 }}
                                    py={1}
                                    borderRadius="full"
                                    fontWeight="600"
                                    fontSize="xs"
                                >
                                    Priorità: {
                                        getPriorityFromAsana(taskDetail) === 'urgent' ? 'Urgente' :
                                            getPriorityFromAsana(taskDetail) === 'high' ? 'Alta' :
                                                getPriorityFromAsana(taskDetail) === 'medium' ? 'Media' : 'Bassa'
                                    }
                                </Badge>

                                {/* Badge Data di Scadenza */}
                                <Badge
                                    colorScheme={formatDueDate(taskDetail.due_on ? new Date(taskDetail.due_on) : undefined).colorScheme}
                                    fontSize="xs"
                                    px={{ base: 2, md: 3 }}
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
                                    <Text fontSize="sm" color="gray.600" lineHeight="1.6" wordBreak="break-word" overflowWrap="break-word">
                                        {renderTextWithLinks(taskDetail.notes)}
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
                                        <span>
                                            {isDescriptionExpanded
                                                ? (isMobile ? 'Mostra meno' : 'Mostra meno')
                                                : (isMobile ? 'Mostra tutto' : 'Mostra tutto')
                                            }
                                        </span>
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
                                        {(isAttachmentsExpanded ? taskDetail.attachments : taskDetail.attachments.slice(0, 3)).map((attachment: any, index: number) => (
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

                                        {/* Pulsante mostra tutto/mostra meno per allegati */}
                                        {taskDetail.attachments.length > 3 && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                color="blue.500"
                                                fontSize="sm"
                                                fontWeight="600"
                                                onClick={() => setIsAttachmentsExpanded(!isAttachmentsExpanded)}
                                                mt={1}
                                            >
                                                <HStack gap={2}>
                                                    <span>
                                                        {isAttachmentsExpanded
                                                            ? (isMobile ? 'Mostra meno' : 'Mostra meno')
                                                            : `Mostra tutti (${taskDetail.attachments.length - 3} nascosti)`
                                                        }
                                                    </span>
                                                    <Icon
                                                        as={FiChevronRight}
                                                        transform={isAttachmentsExpanded ? 'rotate(-90deg)' : 'rotate(90deg)'}
                                                        transition="transform 0.2s"
                                                    />
                                                </HStack>
                                            </Button>
                                        )}
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
                            {loadingComments || (comments.length > 0 && !currentAsanaUser) ? (
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
                                                    {(() => {
                                                        // Prima cerca il nome del cliente da Firestore (nome webapp)
                                                        let displayName = firestoreData?.clientName;

                                                        // Se non trovato in Firestore, cerca nei custom fields Asana
                                                        if (!displayName) {
                                                            const clientNameField = taskDetail.custom_fields?.find(
                                                                (cf: any) => cf.name?.toLowerCase() === 'nome cliente' ||
                                                                    cf.name?.toLowerCase() === 'client_name' ||
                                                                    cf.name?.toLowerCase() === 'cliente' ||
                                                                    cf.name?.toLowerCase() === 'task_creator_name'
                                                            );
                                                            displayName = clientNameField?.display_value;
                                                        }

                                                        // Se è un commento tecnico, mostra il nome del cliente
                                                        if (currentAsanaUser && comment.created_by.gid === currentAsanaUser.gid) {
                                                            if (displayName) {
                                                                return displayName;
                                                            }
                                                            // Fallback: nome dell'utente tecnico
                                                            return currentAsanaUser.name || 'Supporto';
                                                        }

                                                        // Per commenti di altre persone, mostra il nome originale
                                                        return comment.created_by.name;
                                                    })()}
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
                                                wordBreak="break-word"
                                                overflowWrap="break-word"
                                            >
                                                <Text fontSize="sm" color="gray.800" lineHeight="1.6" whiteSpace="pre-wrap" wordBreak="break-word" overflowWrap="break-word">
                                                    {renderTextWithLinks(comment.text)}
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
                                        minW={0}
                                    >
                                        <VStack gap={2} align="stretch">
                                            <HStack gap={2} justify="space-between">
                                                <HStack gap={2} flex={1} minW={0}>
                                                    <Icon as={FiMic} boxSize="16px" color="#25D366" flexShrink={0} />
                                                    <VStack align="flex-start" gap={0} flex={1} minW={0}>
                                                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                                                            Nota vocale
                                                        </Text>
                                                        <Text fontSize="xs" color="gray.500">
                                                            {formatRecordingTime(recordingTime)}
                                                        </Text>
                                                    </VStack>
                                                </HStack>
                                                <IconButton
                                                    aria-label="Elimina audio"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={cancelRecording}
                                                    borderRadius="full"
                                                    color="red.500"
                                                    flexShrink={0}
                                                >
                                                    <FiX />
                                                </IconButton>
                                            </HStack>
                                            <audio
                                                src={URL.createObjectURL(audioBlob)}
                                                controls
                                                style={{
                                                    height: '32px',
                                                    width: '100%'
                                                }}
                                            />
                                        </VStack>
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
                                        minW="48px"
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
                                        fontSize="16px"
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
                                        disabled={!newComment.trim() || taskDetail.completed}
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

                        {/* Info sui file supportati */}
                        <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
                            Tutti i formati sono supportati • Dimensione massima: 50MB per file
                        </Text>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
