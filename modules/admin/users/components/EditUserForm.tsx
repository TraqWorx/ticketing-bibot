/**
 * COMPONENT: EditUserForm
 * 
 * Form per modifica utente CLIENT esistente
 * 
 * Campi modificabili:
 * - Nome
 * - Cognome
 * - ghl_contact_id (GoHighLevel Contact ID)
 * 
 * Campi NON modificabili (readonly):
 * - Email
 * - Telefono
 * 
 * Pattern: Componente controllato con validazioni
 */

import { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Input,
    Button,
    Text,
    IconButton,
    Separator,
    Heading,
    Spinner
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiLink } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { User } from '@/types';
import { CustomLink } from '@/types/customLink';
import axios from '@/utils/axios';

interface EditUserFormProps {
    user: User;
    onSubmit: (data: { firstName: string; lastName: string; phone: string; ghl_contact_id: string; company: string }, customLinks: CustomLink[]) => Promise<void>;
    onCancel?: () => void;
}

export const EditUserForm = ({ user, onSubmit, onCancel }: EditUserFormProps) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        ghl_contact_id: user.ghl_contact_id,
        company: user.company || '',
    });

    const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
    const [loadingLinks, setLoadingLinks] = useState(true);
    const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Carica i custom link esistenti
    useEffect(() => {
        const fetchCustomLinks = async () => {
            try {
                const response = await axios.get(`/api/custom-links/${user.id}`);
                setCustomLinks(response.data.links || []);
            } catch (error) {
                console.error('Error fetching custom links:', error);
                toast.error('Impossibile caricare i custom link');
            } finally {
                setLoadingLinks(false);
            }
        };

        fetchCustomLinks();
    }, [user.id]);

    // Validazione form
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof typeof formData, string>> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Nome obbligatorio';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Cognome obbligatorio';
        }
        if (!formData.ghl_contact_id.trim()) {
            newErrors.ghl_contact_id = 'GoHighLevel Contact ID obbligatorio';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData, customLinks);
        } catch (error: any) {
            toast.error(error.message || 'Errore durante l\'aggiornamento');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gestione custom links
    const addCustomLink = () => {
        const newLink: CustomLink = {
            id: `temp_${Date.now()}`,
            label: '',
            url: '',
            order: customLinks.length,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setCustomLinks([...customLinks, newLink]);
    };

    const removeCustomLink = (id: string) => {
        setCustomLinks(customLinks.filter(link => link.id !== id));
    };

    const updateCustomLink = (id: string, field: 'label' | 'url', value: string) => {
        setCustomLinks(customLinks.map(link =>
            link.id === id ? { ...link, [field]: value, updatedAt: new Date() } : link
        ));
    };

    return (
        <form onSubmit={handleSubmit}>
            <VStack gap={4} align="stretch">

                {/* Nome e Cognome */}
                <HStack gap={4} align="start">
                    <Box flex={1}>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>Nome</Text>
                        <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="Mario"
                            borderColor={errors.firstName ? 'red.500' : 'gray.200'}
                        />
                        {errors.firstName && (
                            <Text color="red.500" fontSize="sm" mt={1}>{errors.firstName}</Text>
                        )}
                    </Box>

                    <Box flex={1}>
                        <Text fontSize="sm" fontWeight="medium" mb={1}>Cognome</Text>
                        <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Rossi"
                            borderColor={errors.lastName ? 'red.500' : 'gray.200'}
                        />
                        {errors.lastName && (
                            <Text color="red.500" fontSize="sm" mt={1}>{errors.lastName}</Text>
                        )}
                    </Box>
                </HStack>

                {/* Email (readonly) */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">Email</Text>
                    <Input
                        type="email"
                        value={user.email}
                        readOnly
                        bg="gray.100"
                        color="gray.600"
                        cursor="not-allowed"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        L'email non è modificabile
                    </Text>
                </Box>

                {/* Telefono (readonly) */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">Telefono</Text>
                    <Input
                        type="tel"
                        value={formData.phone}
                        readOnly
                        bg="gray.100"
                        color="gray.600"
                        cursor="not-allowed"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        Il telefono non è modificabile
                    </Text>
                </Box>

                {/* Company */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>Azienda</Text>
                    <Input
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Nome dell'azienda"
                        borderColor={errors.company ? 'red.500' : 'gray.200'}
                    />
                    {errors.company && (
                        <Text color="red.500" fontSize="sm" mt={1}>{errors.company}</Text>
                    )}
                </Box>

                {/* GoHighLevel Contact ID */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>GoHighLevel Contact ID</Text>
                    <Input
                        value={formData.ghl_contact_id}
                        onChange={(e) => setFormData({ ...formData, ghl_contact_id: e.target.value })}
                        placeholder="esempio: tVzupNVXBYywRntrWQVX"
                        borderColor={errors.ghl_contact_id ? 'red.500' : 'gray.200'}
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                        ID del contatto su GoHighLevel per sincronizzazione
                    </Text>
                    {errors.ghl_contact_id && (
                        <Text color="red.500" fontSize="sm" mt={1}>{errors.ghl_contact_id}</Text>
                    )}
                </Box>

                {/* Custom Links Section */}
                <Box mt={6}>
                    <Separator mb={6} />

                    <HStack justify="space-between" mb={4}>
                        <HStack gap={2}>
                            <FiLink />
                            <Heading size="sm">Link Rapidi</Heading>
                        </HStack>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={addCustomLink}
                            disabled={loadingLinks}
                        >
                            Aggiungi Link
                        </Button>
                    </HStack>

                    {loadingLinks ? (
                        <Box textAlign="center" py={4}>
                            <Spinner size="sm" />
                            <Text fontSize="sm" color="gray.600" mt={2}>
                                Caricamento link...
                            </Text>
                        </Box>
                    ) : (
                        <>
                            <Text fontSize="sm" color="gray.600" mb={4}>
                                Gestisci i link rapidi personalizzati per il cliente
                            </Text>

                            {customLinks.length > 0 && (
                                <VStack gap={3} align="stretch">
                                    {customLinks.map((link) => (
                                        <Box
                                            key={link.id}
                                            p={4}
                                            bg="gray.50"
                                            borderRadius="md"
                                            borderWidth="1px"
                                            borderColor="gray.200"
                                        >
                                            <HStack align="start" gap={3}>
                                                <VStack flex={1} gap={3} align="stretch">
                                                    <Input
                                                        placeholder="Nome del link (es: Cartella Drive)"
                                                        value={link.label}
                                                        onChange={(e) => updateCustomLink(link.id, 'label', e.target.value)}
                                                        bg="white"
                                                        size="sm"
                                                    />
                                                    <Input
                                                        placeholder="https://..."
                                                        value={link.url}
                                                        onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)}
                                                        bg="white"
                                                        size="sm"
                                                    />
                                                </VStack>
                                                <IconButton
                                                    aria-label="Rimuovi link"
                                                    onClick={() => removeCustomLink(link.id)}
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <FiTrash2 />
                                                </IconButton>
                                            </HStack>
                                        </Box>
                                    ))}
                                </VStack>
                            )}
                        </>
                    )}
                </Box>

                {/* Actions */}
                <HStack gap={3} justify="flex-end" pt={4}>
                    {onCancel && (
                        <Button variant="ghost" onClick={onCancel}>
                            Annulla
                        </Button>
                    )}
                    <Button
                        type="submit"
                        bg="brand.500"
                        color="white"
                        _hover={{ bg: 'brand.600' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
                    </Button>
                </HStack>
            </VStack>
        </form>
    );
};
