/**
 * ROUTE: /dashboard/ticketing
 * 
 * Pagina route Next.js per modulo Ticketing
 * 
 * Pattern: Thin page component
 * - Importa componente da /modules/ticketing/pages
 * - Applica DashboardLayout
 * - Mantiene routing Next.js pulito e separato dalla logica moduli
 */

import { DashboardLayout } from '@/layouts/DashboardLayout';
import TicketingPage from '@/modules/ticketing/pages';

export default function DashboardTicketing() {
  return (
    <DashboardLayout>
      <TicketingPage />
    </DashboardLayout>
  );
}
