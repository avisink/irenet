import React from 'react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { Leaf, LogOut, Home, Package, FileText, GitMerge, BarChart, PlusCircle, Search } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function DashboardLayout({ children, currentPage, onNavigate }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();

  const donorMenuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'my-donations', label: 'My Donations', icon: Package },
    { id: 'create-donation', label: 'Create New Donation', icon: PlusCircle },
    { id: 'browse-requests', label: 'Browse Requests', icon: Search },
    { id: 'my-matches', label: 'My Matches', icon: GitMerge },
  ];

  const orgMenuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'my-requests', label: 'My Requests', icon: FileText },
    { id: 'my-matches', label: 'Create New Request', icon: PlusCircle },
    { id: 'matches', label: 'Matches', icon: GitMerge },
    { id: 'donations', label: 'Donations', icon: Package },
  ];

  const adminMenuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'all-donations', label: 'All Donations', icon: Package },
    { id: 'all-requests', label: 'All Requests', icon: FileText },
    { id: 'all-matches', label: 'All Matches', icon: GitMerge },
    { id: 'stats', label: 'Statistics', icon: BarChart },
  ];

  const menuItems =
    user?.role === 'admin'
      ? adminMenuItems
      : user?.role === 'organization'
      ? orgMenuItems
      : donorMenuItems;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="size-8 text-green-600" />
            <div>
              <h1 className="text-2xl text-green-800">ireNet</h1>
              <p className="text-sm text-gray-500">
                {user?.role === 'organization'
                  ? (user.organization?.orgName || user?.name)
                  : user?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.role === 'organization' ? 'Organization' : user?.role === 'admin' ? 'Admin' : 'Donor'}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="size-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentPage === item.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}