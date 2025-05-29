
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { User } from 'lucide-react';

export function DashboardHeader() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="lg:hidden" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your files and organization</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
            <p className="text-xs text-gray-600">{user.organization || 'Organization'}</p>
          </div>
          <div className="bg-blue-100 p-2 rounded-full">
            <User className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>
    </header>
  );
}
