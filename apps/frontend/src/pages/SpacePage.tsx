// src/pages/SpacePage.tsx
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { authApi } from '@/api/api';
import { toast } from 'sonner';

export default function SpacePage() {
  const router = useRouter();

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-900">
                Document Space
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Welcome to Your Document Space
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            This is where all your RAG-powered document management will happen
          </p>
          
          {/* Placeholder for future features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
              <p className="text-slate-600">PDF, text, and URL processing</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold mb-2">AI Chat</h3>
              <p className="text-slate-600">Natural language querying</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="text-lg font-semibold mb-2">Search & Filter</h3>
              <p className="text-slate-600">Temporal and namespace searches</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}