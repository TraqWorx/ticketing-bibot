/**
 * LAYOUT: Client Layout
 * 
 * Layout per ruolo CLIENT
 * 
 * Architettura:
 * - Header con stato account
 * - Sidebar con sezione Support (Ticketing)
 * - Content area principale
 * - Responsive
 * 
 * Pattern: Layout riutilizzabile per tutte le pagine client
 * Ticketing è una feature nella sezione Support, non l'intera app
 * No business logic - solo structure
 */

import { Box, Container } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { ClientHeader } from '@/components/ClientHeader';
import { ClientDesktopSidebar, ClientMobileSidebar } from '@/components/ClientSidebar';

interface ClientLayoutProps {
  children: ReactNode;
  accountStatus?: 'active' | 'suspended';
}

export const ClientLayout = ({ children, accountStatus = 'active' }: ClientLayoutProps) => {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header Mobile - Fixed */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={99}
        display={{ base: 'block', lg: 'none' }}
      >
        <ClientHeader accountStatus={accountStatus} />
      </Box>

      {/* Sidebar Desktop - Fixed */}
      <ClientDesktopSidebar />
      
      {/* Sidebar Mobile - Drawer */}
      <ClientMobileSidebar />

      {/* Main Content */}
      <Box
        ml={{ base: 0, lg: '260px' }}
        pt={{ base: '70px', lg: 0 }}
        minH="100vh"
      >
        {/* Header Desktop */}
        <Box display={{ base: 'none', lg: 'block' }}>
          <ClientHeader accountStatus={accountStatus} />
        </Box>

        <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};
