/**
 * COMPONENT: EditUserForm
 * 
 * Form per modifica utente CLIENT esistente
 * 
 * Campi modificabili:
 * - Nome
 * - Cognome
 * - Telefono
 * - ghl_contact_id (GoHighLevel Contact ID)
 * 
 * Campi NON modificabili (readonly):
 * - Email
 * - Client ID
 * 
 * Pattern: Componente controllato con validazioni
 */

import { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Input,
    Button,
    Text,
} from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { User } from '@/types/user';

interface EditUserFormProps {
    user: User;
    onSubmit: (data: { firstName: string; lastName: string; phone: string; ghl_contact_id: string }) => Promise<void>;
    onCancel?: () => void;
}

export const EditUserForm = ({ user, onSubmit, onCancel }: EditUserFormProps) => {
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        ghl_contact_id: user.ghl_contact_id,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validazione form
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof typeof formData, string>> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Nome obbligatorio';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Cognome obbligatorio';
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
        } catch (error: any) {
            toast.error(error.message || 'Errore durante l\'aggiornamento');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
                {/* Client ID (readonly) */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">Client ID</Text>
                    <Input
                        value={user.client_id}
                        isReadOnly
                        bg="gray.100"
                        color="gray.600"
                        cursor="not-allowed"
                    />
                </Box>

                {/* Email (readonly) */}
                <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">Email</Text>
                    <Input
                        type="email"
                        value={user.email}
                        isReadOnly
                        bg="gray.100"
                        color="gray.600"
                        cursor="not-allowed"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        Email e Client ID non sono modificabili
                    </Text>
                </Box>

                {/* Nome e Cognome */}
                <HStack spacing={4} align="start">
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
                        placeholder="ghl-contact-123456"
                        borderColor={errors.ghl_contact_id ? 'red.500' : 'gray.200'}
                    />
                    <Text fontSize="xs" color="gray.600" mt={1}>
                        ID del contatto su GoHighLevel per sincronizzazione
                    </Text>
                    {errors.ghl_contact_id && (
                        <Text color="red.500" fontSize="sm" mt={1}>{errors.ghl_contact_id}</Text>
                    )}
                </Box>

                {/* Actions */}
                <HStack spacing={3} justify="flex-end" pt={4}>
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
                        {isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
                    </Button>
                </HStack>
            </VStack>
        </form>
    );
};
