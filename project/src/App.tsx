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
import { useHouseholds, useFamilyMembers, useDuesPayments, useUsers, useLocations } from './hooks/useSupabase';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { households, updateHousehold, deleteHousehold, refetch: refetchHouseholds } = useHouseholds();
  const { members, createMember, updateMember, deleteMember } = useFamilyMembers();
  const { payments, createPayment, updatePayment, deletePayment } = useDuesPayments();
  const { users, createUser, updateUser, deleteUser } = useUsers();
  const { locations, createLocation, updateLocation, deleteLocation } = useLocations();

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

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (authLoading) {
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
            members={members}
            payments={payments}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'households':
        return (
          <Households
            households={households}
            members={members}
            locations={locations}
            onCreateMember={async (member) => {
              const newMember = await createMember(member as any);
              if (member.is_household_leader) {
                refetchHouseholds();
              }
              return newMember as any;
            }}
            onUpdateHousehold={async (id, h) => updateHousehold(id, { ...h, created_date: h.created_date ? h.created_date.toISOString() : undefined } as any) as any}
            onDeleteHousehold={deleteHousehold}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'members':
        return (
          <Members
            members={members}
            households={households}
            locations={locations}
            onCreateMember={async (member) => {
              const newMember = await createMember(member as any);
              if (member.is_household_leader) {
                refetchHouseholds();
              }
              return newMember as any;
            }}
            onUpdateMember={async (id, m) => updateMember(id, { ...m, membership_date: m.membership_date ? m.membership_date.toISOString() : undefined, birth_date: m.birth_date ? m.birth_date.toISOString() : undefined } as any) as any}
            onDeleteMember={deleteMember}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'dues':
        return (
          <DuesCollection
            payments={payments}
            members={members}
            households={households}
            onCreatePayment={async (p) => createPayment({ ...p, payment_date: p.payment_date ? p.payment_date.toISOString() : new Date().toISOString() } as any) as any}
            onUpdatePayment={async (id, p) => updatePayment(id, { ...p, payment_date: p.payment_date ? p.payment_date.toISOString() : undefined } as any) as any}
            onDeletePayment={deletePayment}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'reports':
        return (
          <Reports
            households={households}
            members={members}
            payments={payments}
            locations={locations}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      case 'settings':
        return (
          <Settings
            users={users}
            locations={locations}
            onCreateUser={async (u) => createUser({ ...u, last_login: u.last_login ? u.last_login.toISOString() : null } as any) as any}
            onUpdateUser={async (id, u) => updateUser(id, { ...u, last_login: u.last_login ? u.last_login.toISOString() : undefined } as any) as any}
            onDeleteUser={deleteUser}
            onCreateLocation={async (loc) => createLocation({ ...loc, created_date: new Date().toISOString(), updated_date: new Date().toISOString() } as any) as any}
            onUpdateLocation={async (id, loc) => updateLocation(id, { ...loc, created_date: undefined } as any) as any}
            onDeleteLocation={deleteLocation}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
      default:
        return (
          <Dashboard
            households={households}
            members={members}
            payments={payments}
            onMenuClick={() => setSidebarOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
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
