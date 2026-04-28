/**
 * COMPONENT: CreateUserForm
 * 
 * Form per creazione nuovo utente CLIENT
 * 
 * Campi:
 * - Nome
 * - Cognome
 * - Email
 * - Telefono
 * - ghl_contact_id (GoHighLevel Contact ID)
 * 
 * Pattern: Componente controllato con validazioni
 * Design: Form pulito, moderno, CTA evidente
 */

import { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Input,
    Button,
    Text,
    Heading,
    IconButton,
    Separator
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiLink } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { CreateUserInput } from '@/types/user';
import { CreateCustomLinkInput } from '@/types/customLink';

interface CreateUserFormProps {
    onSubmit: (data: CreateUserInput, customLinks: CreateCustomLinkInput[]) => Promise<void>;
    onCancel?: () => void;
}

export const CreateUserForm = ({ onSubmit, onCancel }: CreateUserFormProps) => {
    const [formData, setFormData] = useState<CreateUserInput>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
    });

    const [customLinks, setCustomLinks] = useState<CreateCustomLinkInput[]>([]);
    const [errors, setErrors] = useState<Partial<Record<keyof CreateUserInput, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validazione form
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CreateUserInput, string>> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Nome obbligatorio';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Cognome obbligatorio';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email obbligatoria';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email non valida';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Telefono obbligatorio';
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
        } catch (error) {
            // Errore gestito dal parent
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Gestione custom links
    const addCustomLink = () => {
        setCustomLinks([...customLinks, { label: '', url: '' }]);
    };

    const removeCustomLink = (index: number) => {
        setCustomLinks(customLinks.filter((_, i) => i !== index));
    };

    const updateCustomLink = (index: number, field: 'label' | 'url', value: string) => {
        const updated = [...customLinks];
        updated[index][field] = value;
        setCustomLinks(updated);
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

                {/* Email */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>Email</Text>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="mario.rossi@example.com"
                        borderColor={errors.email ? 'red.500' : 'gray.200'}
                    />
                    {errors.email && (
                        <Text color="red.500" fontSize="sm" mt={1}>{errors.email}</Text>
                    )}
                </Box>

                {/* Telefono */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>Telefono</Text>
                    <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+39 333 1234567"
                        borderColor={errors.phone ? 'red.500' : 'gray.200'}
                    />
                    {errors.phone && (
                        <Text color="red.500" fontSize="sm" mt={1}>{errors.phone}</Text>
                    )}
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

                {/* Info Box */}
                <Box bg="blue.50" p={4} borderRadius="md" borderLeftWidth="4px" borderLeftColor="blue.500">
                    <Text fontSize="sm" color="gray.700">
                        Il contatto verrà automaticamente creato o recuperato da <strong>Go High Level</strong>. Il cliente riceverà un'email con un <strong>link sicuro</strong> per impostare la propria password.
                    </Text>
                </Box>

                {/* Custom Links Section */}
                <Box mt={6}>
                    <Separator mb={6} />

                    <HStack justify="space-between" mb={4}>
                        <HStack gap={2}>
                            <FiLink />
                            <Heading size="sm">Link Rapidi (Opzionale)</Heading>
                        </HStack>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={addCustomLink}
                        >
                            Aggiungi Link
                        </Button>
                    </HStack>

                    <Text fontSize="sm" color="gray.600" mb={4}>
                        Aggiungi link rapidi personalizzati per il cliente (es: cartella Drive, documenti, brochure, etc.)
                    </Text>

                    {customLinks.length > 0 && (
                        <VStack gap={3} align="stretch">
                            {customLinks.map((link, index) => (
                                <Box
                                    key={index}
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
                                                onChange={(e) => updateCustomLink(index, 'label', e.target.value)}
                                                bg="white"
                                                size="sm"
                                            />
                                            <Input
                                                placeholder="https://..."
                                                value={link.url}
                                                onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                                                bg="white"
                                                size="sm"
                                            />
                                        </VStack>
                                        <IconButton
                                            aria-label="Rimuovi link"
                                            onClick={() => removeCustomLink(index)}
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
                        {isSubmitting ? 'Creazione in corso...' : 'Crea Utente'}
                    </Button>
                </HStack>
            </VStack>
        </form>
    );
};
