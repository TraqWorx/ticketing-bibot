/**
 * ROUTE: /dashboard/settings
 * 
 * Pagina route Next.js per modulo Settings
 */

import { DashboardLayout } from '@/layouts/DashboardLayout';
import SettingsPage from '@/modules/settings/pages';

export default function DashboardSettings() {
  return (
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  );
}
