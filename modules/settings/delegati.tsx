import { useAuth } from '@/contexts/AuthContext';
import { UserDelegate } from '@/types/user';
import { Box, Button, Heading, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function DelegatesSettingsPage() {
    const { user, firebaseUser } = useAuth();
    const [delegates, setDelegates] = useState<UserDelegate[]>(user?.delegates || []);
    const [isSaving, setIsSaving] = useState(false);
    const [fullNames, setFullNames] = useState<string[]>(
        (user?.delegates || []).map(d => `${d.firstName || ''}${d.lastName ? ` ${d.lastName}` : ''}`.trim())
    );

    const handleChange = (idx: number, field: keyof UserDelegate, value: string) => {
        setDelegates(delegates.map((d, i) => i === idx ? { ...d, [field]: value } : d));
    };

    // fullNames holds the raw input value for "Nome e Cognome" so the user can type spaces freely.
    const handleFullNameInputChange = (idx: number, value: string) => {
        setFullNames(fn => fn.map((f, i) => i === idx ? value : f));
    };

    const handleFullNameBlur = (idx: number) => {
        const value = (fullNames[idx] || '').trim();
        const parts = value.split(/\s+/);
        const firstName = parts.shift() || '';
        const lastName = parts.join(' ') || '';
        setDelegates(ds => ds.map((d, i) => i === idx ? { ...d, firstName, lastName } : d));
    };

    const handleAdd = () => {
        setDelegates([...delegates, { firstName: '', lastName: '', email: '', phone: '' }]);
        setFullNames(fn => [...fn, '']);
    };

    const handleRemove = async (idx: number) => {
        const prevDelegates = delegates;
        const prevFullNames = fullNames;

        const newDelegates = delegates.filter((_, i) => i !== idx);
        const newFullNames = fullNames.filter((_, i) => i !== idx);

        // Optimistic UI update
        setDelegates(newDelegates);
        setFullNames(newFullNames);

        try {
            if (!firebaseUser) {
                toast.error('Utente non autenticato');
                // rollback
                setDelegates(prevDelegates);
                setFullNames(prevFullNames);
                return;
            }

            let token: string | null = null;
            try {
                token = await firebaseUser.getIdToken();
            } catch (err) {
                token = null;
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/users/update-delegates', {
                method: 'POST',
                headers,
                body: JSON.stringify({ delegates: newDelegates }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const msg = body?.error || 'Errore salvataggio';
                throw new Error(msg);
            }

            toast.success('Delegato rimosso');
            // AuthContext onSnapshot aggiornerà automaticamente `user`
        } catch (e: any) {
            // rollback
            setDelegates(prevDelegates);
            setFullNames(prevFullNames);
            toast.error(e?.message || 'Impossibile rimuovere delegato');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Chiamata API per aggiornare delegati
            // Ensure user is authenticated client-side
            if (!firebaseUser) {
                toast.error('Utente non autenticato');
                setIsSaving(false);
                return;
            }

            // Get firebase ID token from the auth context and set Authorization header
            let token: string | null = null;
            try {
                token = await firebaseUser?.getIdToken() || null;
            } catch (err) {
                token = null;
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/users/update-delegates', {
                method: 'POST',
                headers,
                body: JSON.stringify({ delegates }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const msg = body?.error || 'Errore salvataggio';
                toast.error(msg);
                return;
            }

            toast.success('Delegati aggiornati');
        } catch (e: any) {
            toast.error(e?.message || 'Errore salvataggio');
        } finally {
            setIsSaving(false);
        }
    };

    const cardBg = 'white';
    const cardBorder = 'gray.200';
    const empty = delegates.length === 0;

    return (
        <Box maxW="700px" mx="auto">
            <Heading mb={2} fontSize="2xl">Gestione Delegati</Heading>
            <Text mb={8} color="gray.500" fontSize="md">
                Aggiungi uno o più delegati per ricevere insieme a te aggiornamenti e notifiche sullo stato dei ticket che hai aperto.            </Text>

            <VStack gap={4} align="stretch">
                {empty && (
                    <Box bg="blue.50" color="blue.800" borderRadius="md" mb={2} px={4} py={3} fontSize="sm" fontWeight="medium">
                        Nessun delegato presente. Aggiungi il primo delegato!
                    </Box>
                )}
                {delegates.map((delegate, idx) => (
                    <Box
                        key={idx}
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={cardBorder}
                        borderRadius="lg"
                        boxShadow="sm"
                        px={5}
                        py={4}
                        position="relative"
                        _hover={{ boxShadow: 'md', borderColor: 'blue.400' }}
                        transition="all 0.2s"
                    >
                        <HStack gap={3} align="start">
                            <Input
                                placeholder="Nome e Cognome"
                                value={fullNames[idx] ?? `${delegate.firstName || ''}${delegate.lastName ? ` ${delegate.lastName}` : ''}`.trim()}
                                onChange={e => handleFullNameInputChange(idx, e.target.value)}
                                onBlur={() => handleFullNameBlur(idx)}
                                size="sm"
                                bg="gray.50"
                                borderColor="gray.200"
                                _focus={{ borderColor: 'blue.400', bg: 'white' }}
                            />
                            <Input
                                placeholder="Email"
                                value={delegate.email}
                                onChange={e => handleChange(idx, 'email', e.target.value)}
                                size="sm"
                                bg="gray.50"
                                borderColor="gray.200"
                                _focus={{ borderColor: 'blue.400', bg: 'white' }}
                            />
                            <Input
                                placeholder="Telefono"
                                value={delegate.phone}
                                onChange={e => handleChange(idx, 'phone', e.target.value)}
                                size="sm"
                                bg="gray.50"
                                borderColor="gray.200"
                                _focus={{ borderColor: 'blue.400', bg: 'white' }}
                            />
                            <IconButton
                                aria-label="Rimuovi"
                                variant="ghost"
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleRemove(idx)}
                                borderRadius="full"
                                _hover={{ bg: 'red.50', color: 'red.500' }}
                            >
                                <FiTrash2 />
                            </IconButton>
                        </HStack>
                    </Box>
                ))}
                <Button onClick={handleAdd} variant="outline" size="md" colorScheme="blue" fontWeight="medium">
                    <FiPlus />
                    Aggiungi Delegato
                </Button>
            </VStack>

            <Button
                mt={10}
                colorScheme="blue"
                onClick={handleSave}
                loading={isSaving}
                size="lg"
                fontWeight="bold"
                w="100%"
                boxShadow="md"
            >
                Salva Delegati
            </Button>
        </Box>
    );
}