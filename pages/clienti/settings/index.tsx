/**
 * ROUTE: /clienti/settings
 *
 * Pagina Settings per CLIENT: usa il `ClientLayout` e mostra il modulo Settings
 */

import { ClientLayout } from '@/layouts/ClientLayout';
import SettingsPage from '@/modules/settings';
import { RoleGuard } from '@/components/RoleGuard';
import { UserRole } from '@/types';

export default function ClientSettings() {
  return (
    <RoleGuard allowedRoles={[UserRole.CLIENT]}>
      <ClientLayout>
        <SettingsPage />
      </ClientLayout>
    </RoleGuard>
  );
}
