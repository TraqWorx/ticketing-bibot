/**
 * ROUTE: /client/ticketing
 * 
 * Pagina Ticketing per CLIENT
 * 
 * Accesso: Solo CLIENT
 * Layout: ClientLayout
 * 
 * Architettura: Ticketing è UNA feature nella sezione Support
 */

import { ClientLayout } from '@/layouts/ClientLayout';
import { RoleGuard } from '@/components/RoleGuard';
import { UserRole } from '@/types/user';
import TicketingPage from '@/modules/ticketing/pages';

export default function ClientTicketingPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.CLIENT]}>
      <ClientLayout>
        <TicketingPage />
      </ClientLayout>
    </RoleGuard>
  );
}
