// src/components/documents/DocumentList.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docApi } from '@/api/api';
import { toast } from 'sonner';
import DocumentCard, { type Document } from './DocumentCard';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentListResponse {
  documents: Document[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDocuments: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}

export default function DocumentList() {
  const queryClient = useQueryClient();

  // Fetch documents
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['userDocuments'],
    queryFn: () => docApi.getUserDocuments({ page: 1, limit: 20 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });




  const documents = data?.data?.documents || [];
  const pagination = data?.data?.pagination;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Failed to load documents</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Your Documents</h2>
        <span className="text-sm text-slate-500">
          {pagination?.totalDocuments || 0} document{pagination?.totalDocuments !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Document Cards */}
      <div className="grid gap-3">
        {documents.map((doc:Document) => (
          <DocumentCard
            key={doc.id}
            document={doc}
          />
        ))}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No documents yet</h3>
            <p className="text-slate-500 mb-4">Upload your first document to get started</p>
          </div>
        )}
      </div>

    </div>
  );
}