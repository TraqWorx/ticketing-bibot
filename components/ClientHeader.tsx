/**
 * COMPONENT: Client Header
 * 
 * Header per ruolo CLIENT con stato account
 * 
 * Features:
 * - Logo/nome app
 * - Badge stato account (Attivo/Sospeso)
 * - User menu
 * - Design professionale
 */

import { Box, Container, HStack, Spacer } from '@chakra-ui/react';
import { UserMenu } from './UserMenu';

export const ClientHeader = () => {
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

                    <UserMenu />
                </HStack>
            </Container>
        </Box>
    );
};
