// src/pages/SpacePage.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { authApi } from '@/api/api';
import { toast } from 'sonner';
import { Menu, X, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/layouts/Sidebar';
import ChatPanel from '@/components/layouts/ChatPanel';
import DocumentList from '@/components/DocumentList';
import DocumentUpload from '@/components/DocumentUpload';

export default function SpacePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      router.navigate({ to: '/login' });
      toast.success('Logged out successfully!');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-2"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-slate-900">
              Your Space
            </h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
            className="p-2"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Document List */}
            <div className="flex-1 overflow-auto p-4">
              <DocumentList />
            </div>
            
            {/* Document Upload Form */}
            <div className="border-t border-slate-200 bg-white p-4">
              <DocumentUpload />
            </div>
          </div>

          {/* Chat Panel */}
          <ChatPanel 
            isOpen={chatOpen} 
            onToggle={() => setChatOpen(!chatOpen)} 
          />
        </div>
      </div>
    </div>
  );
}
