// src/components/layouts/RootLayout.tsx
import { Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <TanStackRouterDevtools />
      )}
    </div>
  );
}