import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { LoginPage } from './components/Auth/LoginPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Households } from './components/Households/Households';
import { Members } from './components/Members/Members';
import { DuesCollection } from './components/DuesCollection/DuesCollection';
import { Reports } from './components/Reports/Reports';
import { Settings } from './components/Settings/Settings';
import { TropaFinder } from './components/TropaFinder/TropaFinder';
import { Logs } from './components/Logs/Logs';
import { useHouseholds, useUsers, useLocations, useAuthProfile, useContributionRates } from './hooks/useSupabase';
import { supabaseHelpers } from './lib/supabase';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { households, updateHousehold, deleteHousehold, refetch: refetchHouseholds } = useHouseholds();
  const { users, createUser, updateUser, deleteUser } = useUsers();
  const { locations, createLocation, updateLocation, deleteLocation } = useLocations();
  const { profile: currentUser, loading: profileLoading } = useAuthProfile();
  const { rates: contributionRates, createRate: createContributionRate } = useContributionRates();

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (event === 'SIGNED_OUT') {
        setCurrentPage('dashboard');
        setSidebarOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && currentUser && !profileLoading) {
      const perms = currentUser.permissions || [];
      if (perms.includes('all')) return;

      const pagePermissionMap: Record<string, string[]> = {
        'dashboard': ['view_dashboard'],
        'households': ['view_households', 'manage_households'],
        'members': ['view_members', 'manage_members'],
        'dues': ['dues_collection'],
        'reports': ['view_reports'],
        'tropafinder': ['tropa_finder'],
        'settings': ['user_management'],
        'logs': ['user_management']
      };

      const requiredPerms = pagePermissionMap[currentPage] || [];
      const hasAccess = requiredPerms.some(p => perms.includes(p));

      if (!hasAccess) {
        const pages = ['dashboard', 'households', 'members', 'dues', 'reports', 'tropafinder', 'settings', 'logs'];
        const firstAllowed = pages.find(page => {
          const reqs = pagePermissionMap[page] || [];
          return reqs.length === 0 || reqs.some(p => perms.includes(p)); // if no reqs, it's allowed
        });
        
        if (firstAllowed && firstAllowed !== currentPage) {
          setCurrentPage(firstAllowed);
        }
      }
    }
  }, [isAuthenticated, currentUser, profileLoading, currentPage]);

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (authLoading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            households={households}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'households':
        return (
          <Households
            households={households}
            locations={locations}
            onCreateMember={async (member) => {
              const res = await supabaseHelpers.createFamilyMember(member as any) as any;
              await supabaseHelpers.logActivity({ action: 'ADD', entity_type: 'MEMBER', entity_id: res.id, details: { firstname: member.firstname, lastname: member.lastname } });
              return res;
            }}
            onUpdateHousehold={async (id, h) => {
              const res = await updateHousehold(id, { ...h, created_date: h.created_date ? h.created_date.toISOString() : undefined } as any) as any;
              await supabaseHelpers.logActivity({ action: 'EDIT', entity_type: 'HOUSEHOLD', entity_id: id, details: { household_name: h.household_name } });
              return res;
            }}
            onDeleteHousehold={async (id) => {
              await deleteHousehold(id);
              await supabaseHelpers.logActivity({ action: 'DELETE', entity_type: 'HOUSEHOLD', entity_id: id });
            }}
            onDeleteMember={async (id) => {
              await supabaseHelpers.deleteFamilyMember(id);
              await supabaseHelpers.logActivity({ action: 'DELETE', entity_type: 'MEMBER', entity_id: id });
            }}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'members':
        return (
          <Members
            households={households}
            locations={locations}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'dues':
        return (
          <DuesCollection
            contributionRates={contributionRates}
            onCreatePayment={async (p) => {
              const res = await supabaseHelpers.createDuesPayment({ ...p, payment_date: p.payment_date ? p.payment_date.toISOString() : new Date().toISOString() } as any) as any;
              await supabaseHelpers.logActivity({ action: 'ADD', entity_type: 'DUES_PAYMENT', entity_id: res.id, details: { amount: p.amount, payment_month: p.payment_month } });
              return res;
            }}
            onUpdatePayment={async (id, p) => {
              const res = await supabaseHelpers.updateDuesPayment(id, { ...p, payment_date: p.payment_date ? p.payment_date.toISOString() : undefined } as any) as any;
              await supabaseHelpers.logActivity({ action: 'EDIT', entity_type: 'DUES_PAYMENT', entity_id: id, details: { amount: p.amount, payment_month: p.payment_month } });
              return res;
            }}
            onDeletePayment={async (id) => {
              await supabaseHelpers.deleteDuesPayment(id);
              await supabaseHelpers.logActivity({ action: 'DELETE', entity_type: 'DUES_PAYMENT', entity_id: id });
            }}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'reports':
        return (
          <Reports
            households={households}
            members={[]}
            payments={[]}
            locations={locations}
            contributionRates={contributionRates}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'tropafinder':
        return (
          <TropaFinder
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'settings':
        return (
          <Settings
            users={users}
            locations={locations}
            contributionRates={contributionRates}
            onCreateContributionRate={createContributionRate}
            onCreateUser={async (u) => {
              const res = await createUser({ ...u, last_login: u.last_login ? u.last_login.toISOString() : null } as any) as any;
              await supabaseHelpers.logActivity({ action: 'ADD', entity_type: 'USER', entity_id: res?.id, details: { email: u.email } });
              return res;
            }}
            onUpdateUser={async (id, u) => {
              const res = await updateUser(id, { ...u, last_login: u.last_login ? u.last_login.toISOString() : undefined } as any) as any;
              await supabaseHelpers.logActivity({ action: 'EDIT', entity_type: 'USER', entity_id: id, details: { email: u.email } });
              return res;
            }}
            onDeleteUser={async (id) => {
              await deleteUser(id);
              await supabaseHelpers.logActivity({ action: 'DELETE', entity_type: 'USER', entity_id: id });
            }}
            onCreateLocation={async (loc) => {
              const res = await createLocation({ ...loc, created_date: new Date().toISOString(), updated_date: new Date().toISOString() } as any) as any;
              await supabaseHelpers.logActivity({ action: 'ADD', entity_type: 'LOCATION', entity_id: res?.id, details: { lgu: loc.lgu, barangay: loc.barangay } });
              return res;
            }}
            onUpdateLocation={async (id, loc) => {
              const res = await updateLocation(id, { ...loc, created_date: undefined } as any) as any;
              await supabaseHelpers.logActivity({ action: 'EDIT', entity_type: 'LOCATION', entity_id: id, details: { lgu: loc.lgu, barangay: loc.barangay } });
              refetchHouseholds();
              return res;
            }}
            onDeleteLocation={async (id) => {
              await deleteLocation(id);
              await supabaseHelpers.logActivity({ action: 'DELETE', entity_type: 'LOCATION', entity_id: id });
            }}
            onMenuClick={() => setSidebarOpen(true)}
            onRefreshHouseholds={refetchHouseholds}
          />
        );
      case 'logs':
        return (
          <Logs
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      default:
        return (
          <Dashboard
            households={households}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentUser={currentUser}
        currentPage={currentPage}
        onPageChange={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />
      {renderCurrentPage()}
    </div>
  );
}

export default App;
