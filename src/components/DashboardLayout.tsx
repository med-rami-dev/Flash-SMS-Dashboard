import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, Globe, Package, Newspaper, LogOut, Phone, HelpCircle } from 'lucide-react';

type NavLinkProps = {
  to: string;
  children: React.ReactNode;
  currentPath: string;
  icon: React.ReactNode;
};

const NavLink: React.FC<NavLinkProps> = ({ to, children, currentPath, icon }) => {
  const isActive = currentPath === to || (to !== '/dashboard' && currentPath.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${isActive
        ? 'bg-secondary text-white font-medium shadow-sm'
        : 'text-sidebar-foreground hover:bg-white/10 hover:text-white'
        }`}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

const DashboardLayout = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50/50">
        <Sidebar>
          <SidebarHeader className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Phone className="w-8 h-8 text-[#004aad]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">FLASH SMS</div>
                <div className="text-xs text-white/70">Admin Dashboard</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 py-6">
            <nav className="space-y-1.5">
              <NavLink to="/dashboard" currentPath={location.pathname} icon={<LayoutDashboard className="w-5 h-5" />}>
                Dashboard
              </NavLink>
              <NavLink to="/dashboard/countries" currentPath={location.pathname} icon={<Globe className="w-5 h-5" />}>
                Countries
              </NavLink>
              <NavLink to="/dashboard/services" currentPath={location.pathname} icon={<Package className="w-5 h-5" />}>
                Services
              </NavLink>
              <NavLink to="/dashboard/offers-news" currentPath={location.pathname} icon={<Newspaper className="w-5 h-5" />}>
                Offers & News
              </NavLink>
              <NavLink to="/dashboard/qa" currentPath={location.pathname} icon={<HelpCircle className="w-5 h-5" />}>
                Q&A
              </NavLink>
            </nav>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-white/10">
            <div className="mb-4 px-3">
              <div className="text-sm font-medium text-white">{user?.name}</div>
              <div className="text-xs text-white/70">Administrator</div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full bg-white/10 text-white hover:bg-white/20 transition-colors gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <div className="flex-1 p-8">
          <div className="mb-6 flex items-center justify-between">
            <SidebarTrigger className="lg:hidden" />
          </div>
          <main className="max-w-7xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
