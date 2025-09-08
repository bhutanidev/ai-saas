// src/components/documents/DocumentUpload.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, FileText, Loader2 } from 'lucide-react';

export default function DocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    // TODO: Implement file upload logic
    setTimeout(() => {
      setIsUploading(false);
      setSelectedFiles(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }, 2000);
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;
    
    setIsUploading(true);
    // TODO: Implement URL processing logic
    setTimeout(() => {
      setIsUploading(false);
      setUrlInput('');
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-900">Add Documents</h3>
      
      <Tabs defaultValue="file" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Add URL
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="file" className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Select files to upload</Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Supported formats: PDF, TXT, DOC, DOCX
            </p>
          </div>
          
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected files:</p>
              <div className="space-y-1">
                {Array.from(selectedFiles).map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span className="text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleFileUpload}
            disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </>
            )}
          </Button>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <div>
            <Label htmlFor="url-input">Enter URL</Label>
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com/document.pdf"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter a URL to fetch and process the content
            </p>
          </div>
          
          <Button 
            onClick={handleUrlUpload}
            disabled={!urlInput.trim() || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Process URL
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}