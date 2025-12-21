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
    Heading
} from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { CreateUserInput } from '@/types/user';

interface CreateUserFormProps {
    onSubmit: (data: CreateUserInput) => Promise<void>;
    onCancel?: () => void;
}

export const CreateUserForm = ({ onSubmit, onCancel }: CreateUserFormProps) => {
    const [formData, setFormData] = useState<CreateUserInput>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        ghl_contact_id: '',
    });

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
            await onSubmit(formData);
            // Reset form on success
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                ghl_contact_id: '',
            });
        } catch (error: any) {
            toast.error(error.message || 'Errore durante l\'invio del form');
        } finally {
            setIsSubmitting(false);
        }
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

                {/* Info Box */}
                <Box bg="blue.50" p={4} borderRadius="md" borderLeftWidth="4px" borderLeftColor="blue.500">
                    <Text fontSize="sm" color="gray.700">
                        Il cliente riceverà un'email con un <strong>link sicuro</strong> per impostare la propria password al primo accesso.
                    </Text>
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
                        bg="black"
                        color="white"
                        _hover={{ bg: 'gray.800' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creazione in corso...' : 'Crea Utente'}
                    </Button>
                </HStack>
            </VStack>
        </form>
    );
};
