/**
 * COMPONENT: Admin Sidebar
 * 
 * Sidebar minimale per ruolo ADMIN
 * 
 * Features:
 * - Menu: Users (unica feature per ora)
 * - Design minimalista
 * - Responsive (drawer su mobile)
 * 
 * Pattern: Configurazione dichiarativa
 * No business logic
 */

import { Box, VStack, HStack, Text, Icon, IconButton, CloseButton } from '@chakra-ui/react';
import { Drawer } from '@chakra-ui/react';
import { FiUsers, FiMenu } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { ReactElement, useState } from 'react';

interface MenuItem {
    label: string;
    icon: ReactElement;
    path: string;
}

// Menu ADMIN - Solo gestione clienti per ora
const adminMenuItems: MenuItem[] = [
    {
        label: 'Gestione Clienti',
        icon: <FiUsers />,
        path: '/admin/users',
    },
];

interface AdminSidebarContentProps {
    onItemClick?: () => void;
}

const AdminSidebarContent = ({ onItemClick }: AdminSidebarContentProps) => {
    const router = useRouter();

    const handleNavigation = (path: string) => {
        router.push(path);
        onItemClick?.();
    };

    return (
        <Box py={4} px={3}>
            <VStack gap={1} align="stretch">
                {adminMenuItems.map((item) => {
                    const isActive = router.pathname.startsWith(item.path);

                    return (
                        <Box
                            key={item.path}
                            px={3}
                            py={2.5}
                            cursor="pointer"
                            bg={isActive ? 'brand.500' : 'transparent'}
                            color={isActive ? 'white' : 'gray.700'}
                            _hover={{
                                bg: isActive ? 'brand.500' : 'gray.100',
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
    );
};

export const AdminDesktopSidebar = () => {
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
                        src="/logo.png"
                        alt="Bibot"
                        style={{ height: '120px', width: 'auto', borderRadius: '20px' }}
                    />
                </Box>
            </Box>
            <AdminSidebarContent />
        </Box>
    );
};

export const AdminMobileSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <IconButton
                aria-label="Open menu"
                onClick={() => setIsOpen(true)}
                position="fixed"
                top={4}
                left={4}
                zIndex={101}
                bg="white"
                color="brand.500"
                border="1px"
                borderColor="gray.200"
                _hover={{ bg: 'gray.50' }}
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
                                    src="/logo.png"
                                    alt="Bibot"
                                    style={{ height: '40px', width: 'auto', borderRadius: '8px' }}
                                />
                                <Drawer.CloseTrigger asChild>
                                    <CloseButton />
                                </Drawer.CloseTrigger>
                            </Box>
                        </Drawer.Header>
                        <Drawer.Body p={0}>
                            <AdminSidebarContent onItemClick={() => setIsOpen(false)} />
                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Drawer.Root>
        </>
    );
};
