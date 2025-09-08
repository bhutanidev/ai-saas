// src/components/layouts/Sidebar.tsx
import { Button } from '@/components/ui/button';
import { LogOut, ChevronLeft, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export default function Sidebar({ isOpen, onToggle, onLogout, isLoggingOut }: SidebarProps) {
  return (
    <div
      className={cn(
        "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-0"
      )}
    >
      {isOpen && (
        <>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Organizations</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-1 h-auto"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Organizations Content */}
          <div className="flex-1 p-4">
            <div className="text-sm text-slate-600 mb-4">
              Keep it blank to be implemented soon
            </div>
            
            {/* Placeholder for organizations list */}
            <div className="space-y-2">
              <div className="p-3 rounded-lg border-2 border-dashed border-slate-300 text-center text-sm text-slate-500">
                Organizations will appear here
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={onLogout}
              disabled={isLoggingOut}
              className="w-full"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}