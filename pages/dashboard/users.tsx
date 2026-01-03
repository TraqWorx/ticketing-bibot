/**
 * ROUTE: /dashboard/users
 * 
 * Pagina route Next.js per modulo Users
 */

import { DashboardLayout } from '@/layouts/DashboardLayout';
import UsersPage from '@/modules/users/pages';

export default function DashboardUsers() {
  return (
    <DashboardLayout>
      <UsersPage />
    </DashboardLayout>
  );
}
