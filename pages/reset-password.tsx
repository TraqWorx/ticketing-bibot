/**
 * PAGE: Reset Password
 *
 * Pagina custom per reset/impostazione password
 * Gestisce il flusso Firebase password reset con UI brandizzata
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Component, ReactNode } from 'react';
import {
    Box,
    Stack,
    VStack,
    Heading,
    Text,
    Input,
    Button,
    InputGroup,
    IconButton,
    Spinner,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { toast } from 'react-toastify';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        console.error('ErrorBoundary caught an error:', error);
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('ErrorBoundary componentDidCatch:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
                    <VStack gap={6} p={8} bg="white" borderRadius="lg" shadow="lg" maxW="md" w="full">
                        <Box p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                            <Text color="red.800" fontWeight="medium">
                                Si è verificato un errore imprevisto
                            </Text>
                            <Text color="red.600" fontSize="sm" mt={2}>
                                Riprova più tardi o contatta il supporto se il problema persiste.
                            </Text>
                        </Box>
                        <Button
                            colorScheme="red"
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                        >
                            Riprova
                        </Button>
                    </VStack>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const auth = getAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userData, setUserData] = useState<{
        email: string;
        firstName: string;
        lastName: string;
        clientId: string;
        ghlContactId: string;
    } | null>(null);

    // Estrai parametri dall'URL
    const { oobCode, mode } = router.query;

    useEffect(() => {
        // Verifica che siamo in modalità reset password
        if (mode && mode !== 'resetPassword') {
            setError('Link non valido per reset password');
        }

        // Se abbiamo un oobCode, prova a ottenere i dati dell'utente dal nostro database
        if (oobCode && typeof oobCode === 'string') {
            (async () => {
                try {
                    // Prima prova a ottenere i dati dal nostro database
                    const response = await fetch(`/api/auth/get-reset-token?oobCode=${encodeURIComponent(oobCode)}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                        setUserEmail(data.email);
                    }
                } catch (error) {
                    console.log('Impossibile ottenere dati utente dal database:', error);
                }

                // Poi prova con Firebase (per compatibilità)
                try {
                    const email = await verifyPasswordResetCode(auth, oobCode);
                    setUserEmail(email);
                } catch (error) {
                    // Se il codice non è valido, non impostiamo l'email da Firebase
                    console.log('Impossibile ottenere email dal codice Firebase:', error);
                }
            })();
        }
    }, [mode, oobCode, auth]);

    // Validazione password
    const validatePassword = useCallback((pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'La password deve essere di almeno 8 caratteri';
        }
        if (!/(?=.*[a-z])/.test(pwd)) {
            return 'La password deve contenere almeno una lettera minuscola';
        }
        if (!/(?=.*[A-Z])/.test(pwd)) {
            return 'La password deve contenere almeno una lettera maiuscola';
        }
        if (!/(?=.*\d)/.test(pwd)) {
            return 'La password deve contenere almeno un numero';
        }
        return null;
    }, []);

    const handleSubmit = useCallback(async () => {

        // Validazioni sincrone
        if (!password || !confirmPassword) {
            const emptyError = 'Inserisci entrambe le password';
            setError(emptyError);
            try { toast.error(emptyError); } catch (toastError) { console.error('Toast error:', toastError); }
            return;
        }

        if (password !== confirmPassword) {
            const mismatchError = 'Le password non coincidono';
            setError(mismatchError);
            try { toast.error(mismatchError); } catch (toastError) { console.error('Toast error:', toastError); }
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            try { toast.error(passwordError); } catch (toastError) { console.error('Toast error:', toastError); }
            return;
        }

        if (!oobCode || typeof oobCode !== 'string') {
            const codeError = 'Link di reset non valido o scaduto';
            setError(codeError);
            try { toast.error(codeError); } catch (toastError) { console.error('Toast error:', toastError); }
            return;
        }

        setIsLoading(true);
        setError('');

        // Gestione asincrona con promise chain
        (async () => {
            try {
                // 🔍 verifica preventiva
                await verifyPasswordResetCode(auth, oobCode);

                // Conferma reset password con Firebase
                await confirmPasswordReset(auth, oobCode, password);

                setSuccess(true);
                try { toast.success('Password impostata con successo! Ora puoi accedere con la tua nuova password.'); } catch (toastError) { console.error('Toast error:', toastError); }

                // Redirect al login dopo 2 secondi
                setTimeout(() => {
                    router.push('/clienti');
                }, 2000);
            } catch (error: any) {
                console.error('Is FirebaseError:', error instanceof FirebaseError);
                let errorMessage = 'Errore durante l\'impostazione della password';

                if (error instanceof FirebaseError) {
                    switch (error.code) {
                        case 'auth/expired-action-code':
                            errorMessage = 'Il link è scaduto. Richiedi un nuovo link.';
                            break;
                        case 'auth/invalid-action-code':
                            errorMessage = 'Il link non è valido o è già stato utilizzato.';
                            break;
                        case 'auth/user-disabled':
                            errorMessage = 'Questo account è stato disabilitato.';
                            break;
                        case 'auth/user-not-found':
                            errorMessage = 'Utente non trovato.';
                            break;
                        case 'auth/weak-password':
                            errorMessage = 'La password è troppo debole.';
                            break;
                        default:
                            errorMessage = error.message || errorMessage;
                    }
                } else {
                    errorMessage = error.message || errorMessage;
                }

                setError(errorMessage);
                try { toast.error(errorMessage); } catch (toastError) { console.error('Toast error:', toastError); }
            } finally {
                setIsLoading(false);
            }
        })();
    }, [password, confirmPassword, oobCode, validatePassword, auth, setError, setIsLoading, setSuccess, toast, router]);

    const handleRequestNewLink = useCallback(async () => {
        if (!userData) {
            setError('Impossibile determinare i dati dell\'utente. Contatta il supporto.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: userData.email }),
            });

            const data = await response.json();

            if (response.ok) {
                setError('');
                try { toast.success('Link di recupero password inviato! Controlla la tua email o whatsapp.'); } catch (toastError) { console.error('Toast error:', toastError); }
            } else {
                setError(data.message || 'Errore durante l\'invio del link');
                try { toast.error(data.message || 'Errore durante l\'invio del link'); } catch (toastError) { console.error('Toast error:', toastError); }
            }
        } catch (error: any) {
            const errorMessage = 'Errore di rete. Riprova più tardi.';
            setError(errorMessage);
            try { toast.error(errorMessage); } catch (toastError) { console.error('Toast error:', toastError); }
        } finally {
            setIsLoading(false);
        }
    }, [userData, toast]);

    return (
        <ErrorBoundary>
            {success ? (
                <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
                    <VStack gap={6} p={8} bg="white" borderRadius="lg" shadow="lg" maxW="md" w="full">
                        <Box p={4} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
                            <Text color="green.800" fontWeight="medium">
                                Password impostata con successo! Reindirizzamento al login...
                            </Text>
                        </Box>
                        <Spinner size="lg" color="green.500" />
                    </VStack>
                </Box>
            ) : (
                <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
            <VStack gap={6} p={8} bg="white" borderRadius="lg" shadow="lg" maxW="md" w="full">
                <VStack gap={2} textAlign="center">
                    <Heading size="lg" color="gray.900">
                        Imposta la tua password
                    </Heading>
                    <Text color="gray.600">
                        Inserisci una password sicura per il tuo account
                    </Text>
                </VStack>

                {error && (
                    <Box p={4} bg="red.50" borderRadius="md" border="1px" borderColor="red.200" textAlign="center">
                        <Text color="red.800" fontWeight="medium">
                            {error}
                        </Text>
                        {error === 'Il link non è valido o è già stato utilizzato.' && userData && (
                            <Button
                                mt={3}
                                size="sm"
                                colorScheme="blue"
                                onClick={handleRequestNewLink}
                                loading={isLoading}
                                loadingText="Invio..."
                            >
                                Richiedi nuovo link
                            </Button>
                        )}
                    </Box>
                )}

                <Box as="div" w="full">
                    <VStack gap={4}>
                        <Box w="full">
                            <Text fontSize="sm" fontWeight="medium" mb={2}>Nuova password</Text>
                            <Box position="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Inserisci la nuova password"
                                    size="lg"
                                    pr="4.5rem"
                                />
                                <IconButton
                                    position="absolute"
                                    right="0.5rem"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    variant="ghost"
                                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                                    onClick={() => setShowPassword(!showPassword)}
                                    size="sm"
                                    h="1.75rem"
                                    w="1.75rem"
                                    minW="1.75rem"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </IconButton>
                            </Box>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                Minimo 8 caratteri, con maiuscola, minuscola e numero
                            </Text>
                        </Box>

                        <Box w="full">
                            <Text fontSize="sm" fontWeight="medium" mb={2}>Conferma password</Text>
                            <Box position="relative">
                                <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Conferma la nuova password"
                                    size="lg"
                                    pr="4.5rem"
                                />
                                <IconButton
                                    position="absolute"
                                    right="0.5rem"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    variant="ghost"
                                    aria-label={showConfirmPassword ? 'Nascondi password' : 'Mostra password'}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    size="sm"
                                    h="1.75rem"
                                    w="1.75rem"
                                    minW="1.75rem"
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </IconButton>
                            </Box>
                        </Box>

                        <Button
                            onClick={handleSubmit}
                            colorScheme="black"
                            bg="black"
                            color="white"
                            size="lg"
                            w="full"
                            loading={isLoading}
                            loadingText="Impostazione password..."
                            _hover={{ bg: 'gray.800' }}
                        >
                            Imposta Password
                        </Button>
                    </VStack>
                </Box>
            </VStack>
        </Box>
            )}
        </ErrorBoundary>
    );
}