// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/api/api';
import { toast } from 'sonner'; // You might want to install sonner for toasts

// Google Identity Services types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (credential: string) => await authApi.googleLogin(credential),
    onSuccess: (data) => {
      console.log('Login successful, data:', data);
      console.log('Attempting to navigate to /space');
      toast.success('Login successful!');
      
      router.navigate({to:'/space'})
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    },
  });

  // Initialize Google Sign-In
  useState(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, // Add this to your .env
          callback: handleCredentialResponse,
        });

        const buttonDiv = document.getElementById('googleSignInButton');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            width: '100%',
          });
        }
      }
    };

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  });

  const handleCredentialResponse = (response: { credential: string }) => {
    setIsLoading(true);
    loginMutation.mutate(response.credential);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your document management space
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            id="googleSignInButton"
            className="flex justify-center"
            style={{ minHeight: '44px' }}
          />
          
          {/* Fallback button if Google Sign-In doesn't load */}
          <Button
            variant="outline"
            className="w-full"
            disabled={loginMutation.isPending}
            onClick={() => {
              if (window.google) {
                window.google.accounts.id.prompt();
              } else {
                toast.error('Google Sign-In is not available');
              }
            }}
          >
            {loginMutation.isPending ? (
              <>Authenticating...</>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}