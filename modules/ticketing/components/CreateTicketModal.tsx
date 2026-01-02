/**
 * COMPONENT: CreateTicketModal
 * 
 * Modale per creazione nuovo ticket da parte del cliente
 * 
 * Features:
 * - Form con titolo, descrizione, allegato
 * - Validazione campi obbligatori
 * - Upload allegati
 * - Integrazione con API Asana
 * 
 * Pattern: Controlled modal con form
 */

import { useState, ChangeEvent, useEffect } from 'react';
import {
  Button,
  VStack,
  Input,
  Textarea,
  Text,
  HStack,
  Box,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { FiUpload, FiX, FiPaperclip } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/Modal';
import { Ticket, TicketStatus } from '../types';
import { TicketPriority } from '../../../types/ticket';
import axios from '@/utils/axios';

interface AxiosError {
  response?: {
    status: number;
    data?: any;
  };
  message?: string;
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ticket: Ticket) => void;
  targetUser?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    ghl_contact_id: string;
  };
}

export const CreateTicketModal = ({ isOpen, onClose, onSuccess, targetUser }: CreateTicketModalProps) => {
  const { user } = useAuth();
  
  // Usa targetUser se fornito (admin che crea per un cliente), altrimenti usa user corrente
  const ticketCreator = targetUser || user;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low' | 'none',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [newlyAddedFiles, setNewlyAddedFiles] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Reset contatore nuovi file dopo 3 secondi
  useEffect(() => {
    if (newlyAddedFiles > 0) {
      const timer = setTimeout(() => setNewlyAddedFiles(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [newlyAddedFiles]);

  // Handler cambio campi form
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler upload allegato
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      
      // Limite 50MB per file
      const invalidFiles = fileArray.filter(file => file.size > 50 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        toast.error('Alcuni file superano il limite di 50MB');
        return;
      }
      
      setAttachments(prev => [...prev, ...fileArray]);
      setNewlyAddedFiles(fileArray.length);
      
      // Notifica aggiunta file
      if (fileArray.length === 1) {
        toast.success(`File "${fileArray[0].name}" aggiunto`);
      } else {
        toast.success(`${fileArray.length} file aggiunti`);
      }
      
      // Reset del campo file per permettere di selezionare gli stessi file di nuovo
      e.target.value = '';
    }
  };

  // Handler drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    // Attiva drag over solo se ci sono file
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter > 0 ? newCounter : 0;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // Limite 50MB per file
      const invalidFiles = fileArray.filter(file => file.size > 50 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        toast.error('Alcuni file superano il limite di 50MB');
        return;
      }
      
      setAttachments(prev => [...prev, ...fileArray]);
      setNewlyAddedFiles(fileArray.length);
      
    }
  };

  // Handler rimozione singolo allegato
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handler submit form
  const handleSubmit = async () => {
    // Validazione
    if (!formData.title.trim()) {
      toast.error('Il titolo è obbligatorio');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('La descrizione è obbligatoria');
      return;
    }

    if (!ticketCreator?.id) {
      toast.error('Utente non autenticato');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepara FormData per includere file
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('creatorId', ticketCreator.id);
      formDataToSend.append('creatorName', `${ticketCreator.firstName} ${ticketCreator.lastName}`);
      formDataToSend.append('creatorPhone', ticketCreator.phone);
      formDataToSend.append('creatorEmail', ticketCreator.email);
      formDataToSend.append('ghlContactId', ticketCreator.ghl_contact_id);

      // Aggiungi tutti gli allegati
      attachments.forEach((file) => {
        formDataToSend.append('attachments', file);
      });

      // Chiamata API per creare task su Asana
      try {
        const response = await axios.post('/api/asana/create-task', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const result = response.data;

        // Verifica che taskGid sia presente
        if (!result.taskGid) {
          throw new Error('Risposta API non valida: taskGid mancante');
        }

        // Mostra successo con informazioni sugli allegati
        if (result.attachmentErrors && result.attachmentErrors > 0) {
          toast.warning(
            `Ticket creato, ma ${result.attachmentErrors} allegato/i non caricato/i. Controlla i log.`,
            { autoClose: 5000 }
          );
        } else {
          toast.success('Ticket creato con successo!', { autoClose: 3000 });
        }

        // Costruisci oggetto ticket dal risultato
        const priorityMap: Record<string, TicketPriority> = {
          high: TicketPriority.URGENT,
          medium: TicketPriority.MEDIUM,
          low: TicketPriority.LOW,
          none: TicketPriority.LOW,
        };

        const newTicket: Ticket = {
          id: result.taskGid,
          title: formData.title,
          description: '',
          status: TicketStatus.OPEN,
          priority: priorityMap[formData.priority] || TicketPriority.MEDIUM,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          commentsCount: 0,
          attachmentsCount: result.attachmentsCount || 0,
          waitingFor: 'admin',
        };

        // Reset form
        setFormData({ title: '', description: '', priority: 'medium' });
        setAttachments([]);

        // Chiudi modale
        onClose();

        // Passa il nuovo ticket al callback
        onSuccess?.(newTicket);
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        if (axiosError?.response?.status !== 401) {
          toast.error('Errore creazione ticket');
        }
      }
    } catch (error: any) {
      console.error('Errore creazione ticket:', error);

      // Gestione errori dettagliata
      const errorMessage = error.response?.data?.message
        || error.message
        || 'Errore durante la creazione del ticket';

      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler chiusura modale
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ title: '', description: '', priority: 'medium' });
      setAttachments([]);
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Nuovo Ticket"
      size="xl"
      footer={
        <HStack gap={3} justify="flex-end" w="full">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            bg="black"
            color="white"
            _hover={{ bg: 'gray.800' }}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Creazione...' : 'Crea Ticket'}
          </Button>
        </HStack>
      }
    >
      <VStack gap={5} align="stretch" py={2}>
              {/* Priorità */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                  Priorità <Text as="span" color="red.500">*</Text>
                </Text>
                <select
                  value={formData.priority}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' | 'none' }))}
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E0',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#A0AEC0'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CBD5E0'}
                >
                  <option value="low">Bassa</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </Box>

              {/* Titolo */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                  Titolo <Text as="span" color="red.500">*</Text>
                </Text>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Es: Errore login mobile"
                  disabled={isSubmitting}
                  _focus={{ borderColor: 'black', boxShadow: '0 0 0 1px black' }}
                />
              </Box>

              {/* Descrizione */}
              <Box>
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                  Descrizione <Text as="span" color="red.500">*</Text>
                </Text>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descrivi il problema in dettaglio..."
                  rows={6}
                  disabled={isSubmitting}
                  resize="vertical"
                  _focus={{ borderColor: 'black', boxShadow: '0 0 0 1px black' }}
                />
              </Box>

              {/* Allegato */}
              <Box>
                <HStack justify="space-between" align="center" mb={2}>
                  <HStack gap={2}>
                    <Icon as={FiPaperclip} color="gray.600" />
                    <Text fontSize="sm" fontWeight="600" color="gray.700">
                      Allegati (opzionali)
                    </Text>
                    {attachments.length > 0 && (
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                        {attachments.length}
                      </Badge>
                    )}
                  </HStack>
                  {newlyAddedFiles > 0 && (
                    <Badge colorScheme="green" variant="solid" fontSize="xs" animation="pulse 2s infinite">
                      +{newlyAddedFiles} aggiunti
                    </Badge>
                  )}
                </HStack>
                
                {/* Area upload */}
                <Box
                  as="label"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  p={4}
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor={
                    isDragOver 
                      ? "green.400" 
                      : attachments.length > 0 
                        ? "blue.300" 
                        : "gray.300"
                  }
                  borderRadius="md"
                  cursor="pointer"
                  bg={
                    isDragOver 
                      ? "green.50" 
                      : newlyAddedFiles > 0 
                        ? "green.50" 
                        : "transparent"
                  }
                  _hover={{ 
                    borderColor: isDragOver 
                      ? "green.500" 
                      : attachments.length > 0 
                        ? "blue.400" 
                        : "gray.400", 
                    bg: isDragOver 
                      ? "green.100" 
                      : attachments.length > 0 
                        ? "blue.50" 
                        : "gray.50" 
                  }}
                  transition="all 0.2s"
                  mb={attachments.length > 0 ? 4 : 0}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  position="relative"
                >
                  <Icon as={FiUpload} color={
                    isDragOver 
                      ? "green.500" 
                      : attachments.length > 0 
                        ? "blue.500" 
                        : "gray.500"
                  } />
                  <VStack gap={1}>
                    <Text fontSize="sm" color={
                      isDragOver 
                        ? "green.600" 
                        : attachments.length > 0 
                          ? "blue.600" 
                          : "gray.600"
                    } fontWeight="500">
                      {isDragOver 
                        ? "Rilascia i file qui" 
                        : attachments.length > 0 
                          ? `Aggiungi altri file (${attachments.length} caricati)` 
                          : "Clicca o trascina per caricare file"
                      }
                    </Text>
                    <Text fontSize="xs" color={isDragOver ? "green.500" : "gray.500"}>
                      {isDragOver ? "🎯 Rilascia per caricare" : "📁 Massimo 50MB per file"}
                    </Text>
                  </VStack>
                  <Input
                    type="file"
                    display="none"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    accept="image/*,.pdf,.doc,.docx,.txt,video/*"
                    multiple
                  />
                </Box>

                {/* Info tipi file accettati */}
                <Text fontSize="xs" color="gray.500" mt={2} mb={attachments.length > 0 ? 4 : 0}>
                  Formati supportati: Immagini (JPG, PNG, GIF), PDF, Word (DOC, DOCX), TXT, Video (MP4, AVI, MOV, etc.)
                </Text>

                {/* Lista allegati caricati */}
                {attachments.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="600" color="gray.700" mb={3}>
                      File allegati ({attachments.length})
                    </Text>
                    <VStack gap={2} align="stretch" maxH="200px" overflowY="auto">
                      {attachments.map((file, index) => (
                        <HStack
                          key={index}
                          p={3}
                          bg="gray.50"
                          borderRadius="md"
                          justify="space-between"
                          border="1px solid"
                          borderColor="gray.200"
                          _hover={{ bg: "gray.100", borderColor: "gray.300" }}
                          transition="all 0.2s"
                        >
                          <HStack gap={3}>
                            <Icon as={FiPaperclip} color="gray.600" />
                            <VStack align="start" gap={0} minW="0" flex="1">
                              <Text fontSize="sm" fontWeight="500" maxW="200px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                {file.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {(file.size / 1024).toFixed(2)} KB
                              </Text>
                            </VStack>
                          </HStack>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleRemoveAttachment(index)}
                            disabled={isSubmitting}
                            _hover={{ bg: "red.50" }}
                          >
                            <Icon as={FiX} />
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </Box>
            </VStack>
    </Modal>
  );
};
