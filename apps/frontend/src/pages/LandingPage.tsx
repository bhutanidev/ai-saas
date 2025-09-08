// src/pages/LandingPage.tsx
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-slate-900">
          Document Management System
        </h1>
        <p className="text-xl text-slate-600 max-w-md">
          Intelligent document processing with RAG capabilities
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link to="/login">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/space">Go to Space</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}