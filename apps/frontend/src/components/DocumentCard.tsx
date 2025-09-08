// src/components/documents/DocumentCard.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, MoreVertical, Link as LinkIcon, Building2, User } from 'lucide-react';

export type DocumentContentType = 'FILE' | 'TEXT' | 'URL';
export type DocumentType = 'PERSONAL' | 'ORGANIZATION';

export interface Document {
  id: string;
  title: string;
  description?: string;
  contentType: DocumentContentType;
  textContent?: string;
  url?: string;
  type: DocumentType;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
  ownerId: string;
  organization?: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
}

interface DocumentCardProps {
  document: Document;
  onDelete?: (id: string) => void;
  onDownload?: (id: string) => void;
}

// Simple date formatting utility
const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

const getContentTypeIcon = (contentType: DocumentContentType) => {
  switch (contentType) {
    case 'FILE':
      return <FileText className="h-5 w-5 text-blue-600" />;
    case 'TEXT':
      return <FileText className="h-5 w-5 text-green-600" />;
    case 'URL':
      return <LinkIcon className="h-5 w-5 text-purple-600" />;
    default:
      return <FileText className="h-5 w-5 text-slate-600" />;
  }
};

const getContentTypeColor = (contentType: DocumentContentType) => {
  switch (contentType) {
    case 'FILE':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'TEXT':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'URL':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const truncateText = (text: string, maxLength: number = 150) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export default function DocumentCard({ document, onDelete, onDownload }: DocumentCardProps) {
  const formatDate = (dateString: string) => {
    return formatTimeAgo(dateString);
  };

  const renderContent = () => {
    switch (document.contentType) {
      case 'TEXT':
        return (
          <div className="mt-2 p-3 bg-slate-50 rounded-md">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {document.textContent ? truncateText(document.textContent) : 'No content available'}
            </p>
          </div>
        );
      case 'URL':
        return (
          <div className="mt-2 p-3 bg-slate-50 rounded-md">
            <a 
              href={document.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
            >
              {document.url}
            </a>
          </div>
        );
      case 'FILE':
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
              {getContentTypeIcon(document.contentType)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h3 className="font-medium text-slate-900 truncate flex-1">
                  {document.title}
                </h3>
                <Badge 
                  variant="outline" 
                  className={`text-xs flex-shrink-0 ${getContentTypeColor(document.contentType)}`}
                >
                  {document.contentType}
                </Badge>
              </div>
              
              {document.description && (
                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                  {document.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <div className="flex items-center gap-1">
                  {document.type === 'ORGANIZATION' ? (
                    <>
                      <Building2 className="h-3 w-3" />
                      <span>{document.organization?.name || 'Organization'}</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" />
                      <span>Personal</span>
                    </>
                  )}
                </div>
                <span>•</span>
                <span>{formatDate(document.createdAt)}</span>
                {document.createdAt !== document.updatedAt && (
                  <>
                    <span>•</span>
                    <span>Updated {formatDate(document.updatedAt)}</span>
                  </>
                )}
              </div>
              
              {renderContent()}
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {document.contentType === 'FILE' && onDownload && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={() => onDownload(document.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(document.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="p-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}