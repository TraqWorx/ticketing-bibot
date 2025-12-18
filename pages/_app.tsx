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
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={system}>
      <AuthProvider>
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
