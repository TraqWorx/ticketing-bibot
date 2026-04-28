/**
 * COMPONENT: Header
 * 
 * Header principale della dashboard
 * 
 * Features:
 * - Logo/Nome applicazione
 * - User menu (avatar, dropdown)
 * - Responsive (mobile/desktop)
 * - Design nero/bianco moderno
 * 
 * Pattern: No business logic - solo UI presentation
 */

import { Box, Container, HStack, Text, Spacer } from '@chakra-ui/react';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  appName?: string;
}

export const Header = ({ appName = 'Bibot' }: HeaderProps) => {

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
        <HStack gap={4}>
          {/* Logo / App Name */}
          <HStack gap={3}>
            <Box
              w={10}
              h={10}
              borderRadius="md"
              overflow="hidden"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <img src="/logo.png" alt="Bibot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <Text 
              fontSize="xl" 
              fontWeight="bold"
              display={{ base: 'none', sm: 'block' }}
            >
              {appName}
            </Text>
          </HStack>

          <Spacer />

          {/* User Menu */}
          <UserMenu />
        </HStack>
      </Container>
    </Box>
  );
};
