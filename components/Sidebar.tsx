/**
 * LAYOUT: Sidebar Navigation Component
 * 
 * Sidebar modulare e responsive con design nero/bianco
 * 
 * Architettura:
 * - Sezione "Features" con moduli configurabili
 * - Array di moduli (facilmente estendibile)
 * - Design minimalista: nero su bianco
 * - Mobile: hamburger menu
 * - Desktop: sidebar fissa
 * 
 * Pattern: Configurazione dichiarativa tramite array
 * No business logic - solo navigation
 * 
 * Chakra UI v3: Usa Drawer.* namespace components
 */

import { Box, VStack, HStack, Text, Icon, IconButton, CloseButton, Separator } from '@chakra-ui/react';
import { Drawer } from '@chakra-ui/react';
import { FiFileText, FiUsers, FiSettings, FiMenu, FiGrid } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { ReactElement, useState } from 'react';

interface MenuItem {
  label: string;
  icon: ReactElement;
  path: string;
}

// Configurazione moduli - Facilmente estendibile
const menuItems: MenuItem[] = [
  {
    label: 'Ticketing',
    icon: <FiFileText />,
    path: '/dashboard/ticketing',
  },
  // Placeholder per future features (commentati per ora)
  // {
  //   label: 'Analytics',
  //   icon: <FiBarChart />,
  //   path: '/dashboard/analytics',
  // },
  // {
  //   label: 'Billing',
  //   icon: <FiCreditCard />,
  //   path: '/dashboard/billing',
  // },
];

interface SidebarContentProps {
  onItemClick?: () => void;
}

// Contenuto sidebar riutilizzabile (desktop + mobile)
const SidebarContent = ({ onItemClick }: SidebarContentProps) => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    onItemClick?.();
  };

  return (
    <Box py={4} px={3}>
      {/* Section: Features */}
      <Box mb={6}>
        <HStack gap={2} px={3} mb={3}>
          <Icon as={() => <FiGrid />} boxSize={4} color="gray.500" />
          <Text 
            fontSize="xs" 
            fontWeight="bold" 
            textTransform="uppercase" 
            lettergap="wide"
            color="gray.500"
          >
            Features
          </Text>
        </HStack>
        
        <VStack gap={1} align="stretch">
          {menuItems.map((item) => {
            const isActive = router.pathname === item.path;
            
            return (
              <Box
                key={item.path}
                px={3}
                py={2.5}
                cursor="pointer"
                bg={isActive ? 'black' : 'transparent'}
                color={isActive ? 'white' : 'gray.700'}
                _hover={{
                  bg: isActive ? 'black' : 'gray.100',
                }}
                borderRadius="lg"
                transition="all 0.2s"
                onClick={() => handleNavigation(item.path)}
              >
                <HStack gap={3}>
                  <Icon as={() => item.icon} boxSize={5} />
                  <Text fontWeight="medium" fontSize="sm">{item.label}</Text>
                </HStack>
              </Box>
            );
          })}
        </VStack>
      </Box>

      <Separator />

      {/* Placeholder: Aggiungi altre sezioni qui */}
      <Box mt={6} px={3}>
        <Text fontSize="xs" color="gray.400">
          Altre feature in arrivo...
        </Text>
      </Box>
    </Box>
  );
};

// Sidebar Desktop (sempre visibile)
export const DesktopSidebar = () => {
  return (
    <Box
      w="260px"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      h="100vh"
      position="fixed"
      left={0}
      top={0}
      display={{ base: 'none', lg: 'block' }}
      overflowY="auto"
    >
      {/* Logo / Brand */}
      <Box p={6} borderBottom="1px" borderColor="gray.200">
        <HStack gap={3}>
          <Box
            w={8}
            h={8}
            bg="black"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="white" fontWeight="bold" fontSize="md">
              B
            </Text>
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="black">
            Blanco Studio
          </Text>
        </HStack>
      </Box>

      {/* Navigation Content */}
      <SidebarContent />
    </Box>
  );
};

// Sidebar Mobile (drawer)
export const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Menu Button */}
      <IconButton
        aria-label="Open menu"
        onClick={onOpen}
        position="fixed"
        top={4}
        left={4}
        zIndex={10}
        bg="white"
        display={{ base: 'flex', lg: 'none' }}
      >
        <FiMenu />
      </IconButton>

      {/* Mobile Drawer */}
      <Drawer.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)} placement="start">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header borderBottom="1px" borderColor="gray.200">
              <Box display="flex" justifyContent="space-between" alignItems="center" w="full">
                <HStack gap={3}>
                  <Box
                    w={8}
                    h={8}
                    bg="black"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="white" fontWeight="bold" fontSize="md">
                      B
                    </Text>
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="black">
                    Blanco Studio
                  </Text>
                </HStack>
                <Drawer.CloseTrigger asChild>
                  <CloseButton />
                </Drawer.CloseTrigger>
              </Box>
            </Drawer.Header>
            <Drawer.Body p={0}>
              <SidebarContent onItemClick={onClose} />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </>
  );
};
