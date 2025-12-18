/**
 * COMPONENT: Client Sidebar
 * 
 * Sidebar per ruolo CLIENT
 * 
 * Features:
 * - Sezione "Support" con Ticketing
 * - Design moderno
 * - Responsive (drawer su mobile)
 * 
 * Pattern: Configurazione dichiarativa
 * Ticketing è UNA delle features, non l'intera app
 */

import { Box, VStack, HStack, Text, Icon, IconButton, CloseButton, Separator } from '@chakra-ui/react';
import { Drawer } from '@chakra-ui/react';
import { FiFileText, FiMenu, FiHelpCircle } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { ReactElement, useState } from 'react';

interface MenuItem {
    label: string;
    icon: ReactElement;
    path: string;
}

// Menu CLIENT - Sezione Support
const supportMenuItems: MenuItem[] = [
    {
        label: 'Ticketing',
        icon: <FiFileText />,
        path: '/client/ticketing',
    },
];

interface ClientSidebarContentProps {
    onItemClick?: () => void;
}

const ClientSidebarContent = ({ onItemClick }: ClientSidebarContentProps) => {
    const router = useRouter();

    const handleNavigation = (path: string) => {
        router.push(path);
        onItemClick?.();
    };

    return (
        <Box py={4} px={3}>
            {/* Sezione: Support */}
            <Box mb={6}>

                <VStack gap={1} align="stretch">
                    {supportMenuItems.map((item) => {
                        const isActive = router.pathname.startsWith(item.path);

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
        </Box>
    );
};

export const ClientDesktopSidebar = () => {
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
            <Box p={6} borderBottom="1px" borderColor="gray.200">
                <Box display="flex" justifyContent="center" alignItems="center">
                    <img
                        src="/logo.svg"
                        alt="Blanco Studio"
                        style={{ height: '150px', width: 'auto' }}
                    />
                </Box>
            </Box>
            <ClientSidebarContent />
        </Box>
    );
};

export const ClientMobileSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <IconButton
                aria-label="Open menu"
                onClick={() => setIsOpen(true)}
                position="fixed"
                top={4}
                left={4}
                zIndex={10}
                bg="white"
                display={{ base: 'flex', lg: 'none' }}
            >
                <FiMenu />
            </IconButton>

            <Drawer.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)} placement="start">
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        <Drawer.Header borderBottom="1px" borderColor="gray.200">
                            <Box display="flex" justifyContent="space-between" alignItems="center" w="full">
                                <img
                                    src="/logo.svg"
                                    alt="Blanco Studio"
                                    style={{ height: '150px', width: 'auto' }}
                                />
                                <Drawer.CloseTrigger asChild>
                                    <CloseButton />
                                </Drawer.CloseTrigger>
                            </Box>
                        </Drawer.Header>
                        <Drawer.Body p={0}>
                            <ClientSidebarContent onItemClick={() => setIsOpen(false)} />
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        </>
    );
};