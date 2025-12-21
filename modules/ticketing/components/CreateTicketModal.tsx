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

import { useState, ChangeEvent } from 'react';
import {
  Button,
  VStack,
  Input,
  Textarea,
  Text,
  HStack,
  Box,
  Icon,
} from '@chakra-ui/react';
import { FiUpload, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/Modal';
import { Ticket, TicketStatus, TicketPriority } from '../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ticket: Ticket) => void;
}

export const CreateTicketModal = ({ isOpen, onClose, onSuccess }: CreateTicketModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low' | 'none',
  });
  const [attachments, setAttachments] = useState<File[]>([]);

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
      
      // Limite 10MB per file
      const invalidFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        toast.error('Alcuni file superano il limite di 10MB');
        return;
      }
      
      setAttachments(prev => [...prev, ...fileArray]);
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

    if (!user?.id) {
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
      formDataToSend.append('creatorId', user.id);
      formDataToSend.append('creatorName', `${user.firstName} ${user.lastName}`);
      formDataToSend.append('creatorPhone', user.phone);
      formDataToSend.append('ghlContactId', user.ghl_contact_id);
      
      // Aggiungi tutti gli allegati
      attachments.forEach((file) => {
        formDataToSend.append('attachments', file);
      });

      // Chiamata API per creare task su Asana
      const axios = require('axios');
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
        toast.success('Ticket creato con successo!');
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
      };
      
      // Reset form
      setFormData({ title: '', description: '', priority: 'medium' });
      setAttachments([]);
      
      // Chiudi modale
      onClose();
      
      // Passa il nuovo ticket al callback
      onSuccess?.(newTicket);
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
                <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
                  Allegati (opzionali)
                </Text>
                
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
                  borderColor="gray.300"
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ borderColor: 'gray.400', bg: 'gray.50' }}
                  transition="all 0.2s"
                  mb={attachments.length > 0 ? 3 : 0}
                >
                  <Icon as={FiUpload} color="gray.500" />
                  <Text fontSize="sm" color="gray.600">
                    Clicca per caricare file (max 10MB ciascuno)
                  </Text>
                  <Input
                    type="file"
                    display="none"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    multiple
                  />
                </Box>

                {/* Info tipi file accettati */}
                <Text fontSize="xs" color="gray.500" mt={2} mb={attachments.length > 0 ? 3 : 0}>
                  Formati supportati: Immagini (JPG, PNG, GIF), PDF, Word (DOC, DOCX), TXT
                </Text>

                {/* Lista allegati caricati */}
                {attachments.length > 0 && (
                  <VStack gap={2} align="stretch">
                    {attachments.map((file, index) => (
                      <HStack
                        key={index}
                        p={3}
                        bg="gray.50"
                        borderRadius="md"
                        justify="space-between"
                      >
                        <HStack gap={2}>
                          <Icon as={FiUpload} color="gray.600" />
                          <VStack align="start" gap={0}>
                            <Text fontSize="sm" fontWeight="500">
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
                          onClick={() => handleRemoveAttachment(index)}
                          disabled={isSubmitting}
                        >
                          <Icon as={FiX} />
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
    </Modal>
  );
};
