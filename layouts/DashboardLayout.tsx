/**
 * LAYOUT: Dashboard Layout
 * 
 * Layout principale della dashboard enterprise
 * 
 * Architettura:
 * - Header fisso in alto (logo, user menu)
 * - Sidebar fissa a sinistra (desktop) / drawer (mobile)
 * - Content area centrale dinamica
 * - Design responsivo mobile-first
 * 
 * Pattern: Composizione di componenti piccoli
 * - Header component
 * - Sidebar component (Desktop/Mobile)
 * - Content wrapper
 * 
 * No business logic - solo layout structure
 * 
 * Usage: Wrappa ogni pagina modulo con questo layout
 */

import { Box, Container } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { DesktopSidebar, MobileSidebar } from '@/components/Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header - Fixed top */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={99}
        display={{ base: 'block', lg: 'none' }} // Mobile/tablet only
      >
        <Header appName="Bibot" />
      </Box>

      {/* Sidebar Desktop - Fixed left */}
      <DesktopSidebar />
      
      {/* Sidebar Mobile - Drawer */}
      <MobileSidebar />

      {/* Main Content Area */}
      <Box
        ml={{ base: 0, lg: '260px' }} // Offset per sidebar desktop
        pt={{ base: '70px', lg: 0 }} // Spazio per header mobile
        minH="100vh"
      >
        {/* Header Desktop - Parte del content flow */}
        <Box display={{ base: 'none', lg: 'block' }}>
          <Header appName="Bibot" />
        </Box>

        {/* Content */}
        <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};
