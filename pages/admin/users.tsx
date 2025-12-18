/**
 * ROUTE: /admin/users
 * 
 * Pagina gestione utenti ADMIN
 * 
 * Accesso: Solo ADMIN
 * Layout: AdminLayout
 */

import { AdminLayout } from '@/layouts/AdminLayout';
import { RoleGuard } from '@/components/RoleGuard';
import { UserRole } from '@/types/user';
import UsersManagementPage from '@/modules/admin/users/pages';

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={[UserRole.ADMIN]}>
      <AdminLayout>
        <UsersManagementPage />
      </AdminLayout>
    </RoleGuard>
  );
}
