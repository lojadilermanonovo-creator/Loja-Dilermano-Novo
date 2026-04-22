import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/src/components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
