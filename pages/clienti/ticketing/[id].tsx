/**
 * ROUTE: /clienti/ticketing/[id]
 * 
 * Pagina Dettaglio Ticket per CLIENT
 * 
 * Accesso: Solo CLIENT
 * Layout: Mobile-first app-like experience
 * 
 * Features:
 * - UI simile ad app mobile
 * - Back button
 * - Full screen detail
 */

import { ClientLayout } from '@/layouts/ClientLayout';
import { RoleGuard } from '@/components/RoleGuard';
import { UserRole } from '@/types';
import TicketDetailPage from '@/modules/ticketing/pages/detail';

export default function ClientTicketDetailPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.CLIENT]}>
      <ClientLayout>
        <TicketDetailPage />
      </ClientLayout>
    </RoleGuard>
  );
}
