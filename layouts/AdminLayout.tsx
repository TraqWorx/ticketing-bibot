/**
 * LAYOUT: Admin Layout
 * 
 * Layout per ruolo ADMIN
 * 
 * Architettura:
 * - Header semplice
 * - Sidebar minimale (solo Users per ora)
 * - Content area principale
 * - Responsive
 * 
 * Pattern: Layout riutilizzabile per tutte le pagine admin
 * No business logic - solo structure
 */

import { Box, Container } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminDesktopSidebar, AdminMobileSidebar } from '@/components/AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
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
        <AdminHeader />
      </Box>

      {/* Sidebar Desktop - Fixed */}
      <AdminDesktopSidebar />
      
      {/* Sidebar Mobile - Drawer */}
      <AdminMobileSidebar />

      {/* Main Content */}
      <Box
        ml={{ base: 0, lg: '260px' }}
        pt={{ base: '70px', lg: 0 }}
        minH="100vh"
      >
        {/* Header Desktop */}
        <Box display={{ base: 'none', lg: 'block' }}>
          <AdminHeader />
        </Box>

        <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};
