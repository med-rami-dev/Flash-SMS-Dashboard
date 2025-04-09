
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';

type NavLinkProps = {
  to: string;
  children: React.ReactNode;
  currentPath: string;
};

const NavLink: React.FC<NavLinkProps> = ({ to, children, currentPath }) => {
  const isActive = currentPath === to || (to !== '/dashboard' && currentPath.startsWith(to));
  
  return (
    <Link
      to={to}
      className={`flex items-center p-3 rounded-md transition-colors ${
        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
      }`}
    >
      {children}
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
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="text-xl font-bold text-sidebar-foreground">Admin Dashboard</div>
            <div className="text-sm text-sidebar-foreground/80">{user?.email}</div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-2">
            <nav className="space-y-2">
              <NavLink to="/dashboard" currentPath={location.pathname}>Dashboard</NavLink>
              <NavLink to="/dashboard/countries" currentPath={location.pathname}>Countries</NavLink>
              <NavLink to="/dashboard/services" currentPath={location.pathname}>Services</NavLink>
              <NavLink to="/dashboard/offers-news" currentPath={location.pathname}>Offers & News</NavLink>
            </nav>
          </SidebarContent>
          <div className="mt-auto p-4">
            <Button onClick={handleSignOut} variant="outline" className="w-full bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80">
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <div className="flex-1 p-8">
          <div className="mb-4 flex items-center justify-between">
            <SidebarTrigger className="lg:hidden" />
          </div>
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
