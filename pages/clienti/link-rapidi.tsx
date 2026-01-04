/**
 * ROUTE: /clienti/link-rapidi
 * 
 * Pagina Link Rapidi per CLIENT
 * 
 * Accesso: Solo CLIENT
 * Layout: ClientLayout
 * 
 * Features:
 * - Visualizzazione dei custom link personalizzati
 * - Design moderno e accattivante con card animate
 * - Icone dinamiche e hover effects
 * - Responsive e mobile-friendly
 */

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Icon,
  Link as ChakraLink,
  Flex,
} from '@chakra-ui/react';
import {
  FiExternalLink,
  FiFolder,
  FiFile,
  FiLink,
  FiBook,
  FiImage,
  FiVideo,
  FiDownload,
  FiGlobe,
  FiShoppingCart,
} from 'react-icons/fi';
import { ClientLayout } from '@/layouts/ClientLayout';
import { RoleGuard } from '@/components/RoleGuard';
import { UserRole } from '@/types';
import { CustomLink } from '@/types/customLink';
import { useAuth } from '@/contexts/AuthContext';
import axios from '@/utils/axios';
import { toast } from 'react-toastify';

// Mappa icone dinamiche in base al nome del link o URL
const getIconForLink = (link: CustomLink) => {
  const label = link.label.toLowerCase();
  const url = link.url.toLowerCase();

  if (label.includes('drive') || label.includes('cartella') || url.includes('drive.google')) return FiFolder;
  if (label.includes('documento') || label.includes('doc') || url.includes('docs.google')) return FiFile;
  if (label.includes('video') || url.includes('youtube') || url.includes('vimeo')) return FiVideo;
  if (label.includes('immagine') || label.includes('foto') || label.includes('gallery')) return FiImage;
  if (label.includes('download') || label.includes('scarica')) return FiDownload;
  if (label.includes('shop') || label.includes('negozio')) return FiShoppingCart;
  if (label.includes('guida') || label.includes('manuale')) return FiBook;
  if (url.includes('http')) return FiGlobe;

  return FiLink;
};

// Colori dinamici per le card
const cardColors = [
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: 'white' },
  { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: 'white' },
  { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', text: 'white' },
  { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', text: 'white' },
  { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', text: 'white' },
  { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', text: 'white' },
  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: 'gray.800' },
  { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', text: 'gray.800' },
];

const LinkCard = ({ link, index }: { link: CustomLink; index: number }) => {
  const IconComponent = getIconForLink(link);
  const colorScheme = cardColors[index % cardColors.length];

  return (
    <ChakraLink
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      _hover={{ textDecoration: 'none', transform: 'translateY(-4px)', boxShadow: '2xl' }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      display="block"
    >
      <Box
        bg={colorScheme.bg}
        color={colorScheme.text}
        borderRadius="xl"
        p={4}
        position="relative"
        overflow="hidden"
        boxShadow="lg"
        h="120px"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        {/* Decorazione sfondo */}
        <Box
          position="absolute"
          top="-15px"
          right="-15px"
          w="60px"
          h="60px"
          borderRadius="full"
          bg="whiteAlpha.200"
        />

        <Box position="absolute" bottom="-20px" left="-20px" w="70px" h="70px" borderRadius="full" bg="whiteAlpha.100" />

        {/* Contenuto */}
        <VStack align="start" gap={2} position="relative" zIndex={1}>
          <Box
            p={2}
            bg="whiteAlpha.300"
            borderRadius="lg"
            backdropFilter="blur(10px)"
            boxShadow="inner"
          >
            <Icon as={IconComponent} boxSize={6} />
          </Box>

          <Heading size="sm" fontWeight="bold" lineHeight="1.2">
            {link.label}
          </Heading>
        </VStack>

        {/* Icona External Link */}
        <HStack justify="flex-end" position="relative" zIndex={1}>
          <Icon as={FiExternalLink} boxSize={4} opacity={0.8} />
        </HStack>
      </Box>
    </ChakraLink>
  );
};

export default function LinkRapidiPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchLinks();
    }
  }, [user]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/custom-links/${user?.id}`);
      setLinks(response.data.links || []);
    } catch (error: any) {
      console.error('Error fetching custom links:', error);
      toast.error('Impossibile caricare i link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.CLIENT]}>
      <ClientLayout>
        <Box minH="100vh" p={{ base: 6, md: 10 }}>
          <VStack gap={8} align="stretch" maxW="1400px" mx="auto">
            {/* Header: Titolo + Descrizione */}
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="lg" fontWeight="700" color="gray.900">
                  Link personalizzati
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Accedi rapidamente alle tue risorse e documenti personalizzati
                </Text>
              </Box>
            </Flex>

            {/* Content */}
            {loading ? (
              <Box textAlign="center" py={20}>
                <Spinner size="xl" color="purple.500" />
                <Text mt={4} fontSize="lg" color="gray.600">
                  Caricamento dei tuoi link...
                </Text>
              </Box>
            ) : links.length === 0 ? (
              <Box
                textAlign="center"
                py={20}
                px={6}
                bg="gray.50"
                borderRadius="2xl"
                borderWidth="2px"
                borderColor="gray.200"
                borderStyle="dashed"
              >
                <Icon as={FiLink} boxSize={16} color="gray.400" mb={4} />
                <Heading size="lg" color="gray.600" mb={2}>
                  Nessun link disponibile
                </Heading>
                <Text color="gray.500" fontSize="md">
                  Non hai ancora link rapidi configurati. Contatta il supporto per aggiungere i tuoi link personalizzati.
                </Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} gap={4}>
                {links.map((link, index) => (
                  <LinkCard key={link.id} link={link} index={index} />
                ))}
              </SimpleGrid>
            )}
          </VStack>
        </Box>
      </ClientLayout>
    </RoleGuard>
  );
}
