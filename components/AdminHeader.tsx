/**
 * COMPONENT: Admin Header
 * 
 * Header semplice per ruolo ADMIN
 * 
 * Features:
 * - Logo/nome app
 * - User menu essenziale
 * - Design minimale
 */

import { Box, Container, HStack, Text, Spacer } from '@chakra-ui/react';
import { UserMenu } from './UserMenu';

export const AdminHeader = () => {
    return (
        <Box
            as="header"
            position="sticky"
            top={0}
            zIndex={100}
            bg="white"
            borderBottom="1px"
            borderColor="gray.200"
            shadow="sm"
        >
            <Container maxW="full" py={3} px={6}>
                <HStack spacing={4}>
                    <Spacer />
                    <UserMenu userName="Admin User" userEmail="admin@blancostudio.com" />
                </HStack>
            </Container>
        </Box>
    );
};
