// src/components/documents/DocumentUpload.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { docApi } from '@/api/api';
import { toast } from 'sonner';
import { Upload, Link, FileText, Loader2, Plus } from 'lucide-react';

type ContentType = 'FILE' | 'TEXT' | 'URL';

interface DocumentFormData {
  title: string;
  description: string;
  contentType: ContentType;
  file: File | null;
  textContent: string;
  url: string;
}

export default function DocumentUpload() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    description: '',
    contentType: 'FILE',
    file: null,
    textContent: '',
    url: '',
  });

  // Upload mutation with proper file handling
  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      let fileKey: string | undefined;

      // Handle file upload if contentType is FILE
      if (data.contentType === 'FILE' && data.file) {
        // Step 1: Generate presigned URL
        const presignedResponse = await docApi.generatePersonalUploadUrl(
          data.file.name,
          'FILE'
        );
        
        const { url: presignedUrl, key } = presignedResponse.data;
        fileKey = key;

        // Step 2: Upload file to S3
        await docApi.uploadToS3(presignedUrl, data.file);
      }

      // Step 3: Save document metadata
      const documentData = {
        title: data.title,
        description: data.description || undefined,
        contentType: data.contentType,
        fileKey: data.contentType === 'FILE' ? fileKey : undefined,
        textContent: data.contentType === 'TEXT' ? data.textContent : undefined,
        url: data.contentType === 'URL' ? data.url : undefined,
      };

      return await docApi.savePersonalDocument(documentData);
    },
    onSuccess: () => {
      // Reset form
      setFormData({
        title: '',
        description: '',
        contentType: 'FILE',
        file: null,
        textContent: '',
        url: '',
      });
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh documents list
      queryClient.invalidateQueries({ queryKey: ['userDocuments'] });
      
      toast.success('Document uploaded successfully!');
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast.error(error?.response?.data?.message || 'Failed to upload document');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (formData.contentType === 'FILE' && !formData.file) {
      toast.error('Please select a file');
      return;
    }

    if (formData.contentType === 'TEXT' && !formData.textContent.trim()) {
      toast.error('Text content is required');
      return;
    }

    if (formData.contentType === 'URL' && !formData.url.trim()) {
      toast.error('URL is required');
      return;
    }

    uploadMutation.mutate(formData);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  const getContentIcon = (type: ContentType) => {
    switch (type) {
      case 'FILE':
        return <Upload className="h-4 w-4" />;
      case 'TEXT':
        return <FileText className="h-4 w-4" />;
      case 'URL':
        return <Link className="h-4 w-4" />;
    }
  };

  const renderContentFields = () => {
    switch (formData.contentType) {
      case 'FILE':
        return (
          <div>
            <Label htmlFor="file-upload">Select file</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              className="mt-1"
              accept=".pdf,.txt,.doc,.docx,.md"
            />
            <p className="text-xs text-slate-500 mt-1">
              Supported formats: PDF, TXT, DOC, DOCX, MD
            </p>
            {formData.file && (
              <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                <span className="font-medium">Selected:</span> {formData.file.name}
                <span className="text-slate-500 ml-2">
                  ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>
        );

      case 'TEXT':
        return (
          <div>
            <Label htmlFor="text-content">Text Content</Label>
            <Textarea
              id="text-content"
              placeholder="Enter your text content here..."
              value={formData.textContent}
              onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
              className="mt-1 min-h-[120px]"
              rows={6}
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter the text content you want to save
            </p>
          </div>
        );

      case 'URL':
        return (
          <div>
            <Label htmlFor="url-input">URL</Label>
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com/document"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter a URL to fetch and process the content
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
        <Plus className="h-5 w-5" />
        Add New Document
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content Type Selection */}
        <div>
          <Label htmlFor="content-type">Document Type</Label>
          <Select
            value={formData.contentType}
            onValueChange={(value: ContentType) => 
              setFormData(prev => ({ 
                ...prev, 
                contentType: value,
                file: null,
                textContent: '',
                url: ''
              }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FILE">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  File Upload
                </div>
              </SelectItem>
              <SelectItem value="TEXT">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Text Content
                </div>
              </SelectItem>
              <SelectItem value="URL">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URL Link
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            type="text"
            placeholder="Enter document title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            type="text"
            placeholder="Brief description of the document"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1"
          />
        </div>

        {/* Content-specific fields */}
        {renderContentFields()}

        {/* Submit Button */}
        <Button 
          type="submit"
          disabled={uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {formData.contentType === 'FILE' ? 'Uploading...' : 'Saving...'}
            </>
          ) : (
            <>
              {getContentIcon(formData.contentType)}
              <span className="ml-2">
                {formData.contentType === 'FILE' ? 'Upload File' : 
                 formData.contentType === 'TEXT' ? 'Save Text' : 'Save URL'}
              </span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}