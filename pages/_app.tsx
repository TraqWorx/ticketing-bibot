/**
 * ROOT: App Entry Point
 * 
 * Next.js App Component - Configurazione globale
 * 
 * Providers:
 * - ChakraProvider: UI theme
 * - AuthProvider: Firebase authentication
 * - ProtectedRoute: Route protection
 * - ToastContainer: Notifiche toast
 */

import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { system } from '@/styles/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import axios from '@/utils/axios';
import { useEffect, useState } from 'react';
import { SessionExpiredModal, setSessionExpiredModalHandler } from '@/components/SessionExpiredModal';

function Axios401Handler() {
  const { signOut } = useAuth();
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    // Registra la funzione globale per mostrare la modale
    setSessionExpiredModalHandler(() => setShowSessionExpired(true));
  }, []);

  const handleSessionExpiredConfirm = async () => {
    setShowSessionExpired(false);
    await signOut();
    window.location.href = '/login';
  };

  const handleSessionExpiredClose = async () => {
    // Anche se la modale è non chiudibile, per sicurezza facciamo logout
    setShowSessionExpired(false);
    await signOut();
    window.location.href = '/login';
  };

  return (
    <SessionExpiredModal
      isOpen={showSessionExpired}
      onClose={handleSessionExpiredClose}
      onConfirm={handleSessionExpiredConfirm}
    />
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={system}>
      <AuthProvider>
        <Axios401Handler />
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      </AuthProvider>
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ChakraProvider>
  );
}
