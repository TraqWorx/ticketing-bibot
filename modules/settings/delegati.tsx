import { useAuth } from '@/contexts/AuthContext';
import { UserDelegate } from '@/types/user';
import { Box, Button, Heading, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function DelegatesSettingsPage() {
    const { user, firebaseUser } = useAuth();
    const [delegates, setDelegates] = useState<UserDelegate[]>(user?.delegates || []);
    const [isSaving, setIsSaving] = useState(false);
    const [fullNames, setFullNames] = useState<string[]>(
        (user?.delegates || []).map(d => `${d.firstName || ''}${d.lastName ? ` ${d.lastName}` : ''}`.trim())
    );
    const [originalDelegates, setOriginalDelegates] = useState<UserDelegate[]>(user?.delegates || []);
    const [touchedName, setTouchedName] = useState<boolean[]>((user?.delegates || []).map(() => false));
    const [touchedEmail, setTouchedEmail] = useState<boolean[]>((user?.delegates || []).map(() => false));
    const [touchedPhone, setTouchedPhone] = useState<boolean[]>((user?.delegates || []).map(() => false));

    const delegatesEqual = (a: UserDelegate[], b: UserDelegate[]) => {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            const x = a[i] || ({} as UserDelegate);
            const y = b[i] || ({} as UserDelegate);
            if ((x.firstName || '').trim() !== (y.firstName || '').trim()) return false;
            if ((x.lastName || '').trim() !== (y.lastName || '').trim()) return false;
            if ((x.email || '').trim() !== (y.email || '').trim()) return false;
            if ((x.phone || '').trim() !== (y.phone || '').trim()) return false;
        }
        return true;
    };

    useEffect(() => {
        // refresh baseline from server when user changes
        setOriginalDelegates(user?.delegates || []);
        // if there were no local edits, sync UI with server data
        if (delegates.length === 0 && (user?.delegates || []).length > 0) {
            setDelegates(user?.delegates || []);
            setFullNames((user?.delegates || []).map(d => `${d.firstName || ''}${d.lastName ? ` ${d.lastName}` : ''}`.trim()));
        }
        // ensure touched arrays match current delegates length
        const serverLen = (user?.delegates || []).length;
        setTouchedName(prev => {
            const next = prev.slice(0, serverLen);
            while (next.length < serverLen) next.push(false);
            return next;
        });
        setTouchedEmail(prev => {
            const next = prev.slice(0, serverLen);
            while (next.length < serverLen) next.push(false);
            return next;
        });
        setTouchedPhone(prev => {
            const next = prev.slice(0, serverLen);
            while (next.length < serverLen) next.push(false);
            return next;
        });
    }, [user]);

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
        setTouchedName(prev => {
            const next = [...prev];
            next[idx] = true;
            return next;
        });
    };

    const handleAdd = () => {
        setDelegates([...delegates, { firstName: '', lastName: '', email: '', phone: '' }]);
        setFullNames(fn => [...fn, '']);
        setTouchedName(t => [...t, false]);
        setTouchedEmail(t => [...t, false]);
        setTouchedPhone(t => [...t, false]);
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
            // update baseline
            setOriginalDelegates(newDelegates);
            // remove touched state for removed index
            setTouchedName(prev => prev.filter((_, i) => i !== idx));
            setTouchedEmail(prev => prev.filter((_, i) => i !== idx));
            setTouchedPhone(prev => prev.filter((_, i) => i !== idx));
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

            // update baseline to current state
            setOriginalDelegates(delegates);

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

    const isDirty = !delegatesEqual(delegates, originalDelegates);
    // validators
    const validateEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    const validatePhone = (s: string) => {
        const digits = (s || '').replace(/\D/g, '');
        return digits.length >= 7 && digits.length <= 15;
    };

    const validity = delegates.map((d, idx) => {
        const nameRaw = (fullNames[idx] ?? `${d.firstName || ''} ${d.lastName || ''}`).trim();
        const hasName = nameRaw.length > 0; // allow single-word names
        const email = (d.email || '').trim();
        const phone = (d.phone || '').trim();
        const emailValid = email === '' ? false : validateEmail(email);
        const phoneValid = phone === '' ? false : validatePhone(phone);
        return { hasName, email, phone, emailValid, phoneValid, allFilled: hasName && email !== '' && phone !== '', allValid: hasName && emailValid && phoneValid };
    });

    const allFilled = delegates.length === 0 ? true : validity.every(v => v.allFilled);
    const allValid = delegates.length === 0 ? true : validity.every(v => v.allValid);
    const canSave = isDirty && allFilled && allValid && !isSaving;

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
                            <Box flex={1}>
                                <Input
                                    placeholder="Nome e Cognome"
                                    value={fullNames[idx] ?? `${delegate.firstName || ''}${delegate.lastName ? ` ${delegate.lastName}` : ''}`.trim()}
                                    onChange={e => handleFullNameInputChange(idx, e.target.value)}
                                    onFocus={() => setTouchedName(prev => { const n = [...prev]; n[idx] = false; return n; })}
                                    onBlur={() => handleFullNameBlur(idx)}
                                    size="sm"
                                    bg="gray.50"
                                    borderColor={(!validity[idx]?.hasName && touchedName[idx]) ? 'red.300' : 'gray.200'}
                                    _focus={{ borderColor: (!validity[idx]?.hasName && touchedName[idx]) ? 'red.500' : 'blue.400', bg: 'white' }}
                                />
                                {touchedName[idx] && !validity[idx]?.hasName && (
                                    <Text mt={1} color="red.500" fontSize="xs">Campo obbligatorio</Text>
                                )}
                            </Box>
                            <Box flex={1}>
                                <Input
                                    placeholder="Email"
                                    value={delegate.email}
                                    onChange={e => handleChange(idx, 'email', e.target.value)}
                                    onFocus={() => setTouchedEmail(prev => { const n = [...prev]; n[idx] = false; return n; })}
                                    onBlur={() => setTouchedEmail(prev => { const n = [...prev]; n[idx] = true; return n; })}
                                    size="sm"
                                    bg="gray.50"
                                    borderColor={!(validity[idx]?.emailValid) && (delegate.email || '') !== '' && touchedEmail[idx] ? 'red.300' : 'gray.200'}
                                    _focus={{ borderColor: !(validity[idx]?.emailValid) && (delegate.email || '') !== '' && touchedEmail[idx] ? 'red.500' : 'blue.400', bg: 'white' }}
                                />
                                {touchedEmail[idx] && (!(validity[idx]?.emailValid) && (delegate.email || '') !== '') && (
                                    <Text mt={1} color="red.500" fontSize="xs">Formato email non valido</Text>
                                )}
                            </Box>
                            <Box flex={1}>
                                <Input
                                    placeholder="Telefono"
                                    value={delegate.phone}
                                    onChange={e => handleChange(idx, 'phone', e.target.value)}
                                    onFocus={() => setTouchedPhone(prev => { const n = [...prev]; n[idx] = false; return n; })}
                                    onBlur={() => setTouchedPhone(prev => { const n = [...prev]; n[idx] = true; return n; })}
                                    size="sm"
                                    bg="gray.50"
                                    borderColor={!(validity[idx]?.phoneValid) && (delegate.phone || '') !== '' && touchedPhone[idx] ? 'red.300' : 'gray.200'}
                                    _focus={{ borderColor: !(validity[idx]?.phoneValid) && (delegate.phone || '') !== '' && touchedPhone[idx] ? 'red.500' : 'blue.400', bg: 'white' }}
                                />
                                {touchedPhone[idx] && (!(validity[idx]?.phoneValid) && (delegate.phone || '') !== '') && (
                                    <Text mt={1} color="red.500" fontSize="xs">Formato telefono non valido</Text>
                                )}
                            </Box>
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
                {!allFilled && delegates.length > 0 && (
                    <Text mt={2} fontSize="sm">Tutti i campi sono obbligatori per salvare un nuovo delegato</Text>
                )}
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
                disabled={!canSave}
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