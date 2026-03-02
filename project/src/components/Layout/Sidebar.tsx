import { LayoutDashboard, Home, Users, CreditCard, FileText, Settings, LogOut, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'households', label: 'Households', icon: Home },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'dues', label: 'Dues Collection', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onPageChange, isOpen, onClose, onLogout }: SidebarProps) {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out. Please try again.');
      } else {
        onLogout();
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg h-screen flex flex-col transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 lg:p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TROPA</h1>
                <p className="text-sm text-gray-500">Members Management</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">MAIN MENU</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => onPageChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 lg:py-2 text-left text-sm font-medium rounded-lg transition-colors touch-manipulation",
                  currentPage === item.id
                    ? "bg-teal-50 text-teal-700 border-r-2 border-teal-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100"
                )}>
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-teal-700">ES</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Edsel Soterio</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors touch-manipulation border border-gray-200 hover:border-red-200">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
