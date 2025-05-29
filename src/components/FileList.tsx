import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { File, Share, Upload, Users } from 'lucide-react';
import { ShareDialog } from './ShareDialog';
import { useToast } from "@/hooks/use-toast";

interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  shared: boolean;
}

interface FileListProps {
  documents: DocumentFile[];
  onDocumentsChange: (documents: DocumentFile[]) => void;
  loading: boolean;
}

export function FileList({ documents, onDocumentsChange, loading }: FileListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (documentFile: DocumentFile) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${documentFile.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = documentFile.name;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download started",
          description: `${documentFile.name} is being downloaded.`,
        });
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (documentFile: DocumentFile) => {
    setSelectedFile(documentFile);
    setShowShareDialog(true);
  };

  const handleDelete = async (documentFile: DocumentFile) => {
    if (!confirm(`Are you sure you want to delete ${documentFile.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${documentFile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        onDocumentsChange(documents.filter(doc => doc.id !== documentFile.id));
        toast({
          title: "File deleted",
          description: `${documentFile.name} has been deleted successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your files...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <File className="w-5 h-5 mr-2" />
            My Files ({documents.length})
          </CardTitle>
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'Upload your first file to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((documentFile) => (
              <div key={documentFile.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="bg-blue-100 p-2 rounded">
                      <File className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{documentFile.name}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">{formatFileSize(documentFile.size)}</span>
                        <span className="text-xs text-gray-500">Uploaded {formatDate(documentFile.uploadedAt)}</span>
                        <span className="text-xs text-gray-500">by {documentFile.uploadedBy}</span>
                        {documentFile.shared && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(documentFile)}
                    >
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(documentFile)}
                    >
                      <Share className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(documentFile)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {selectedFile && (
        <ShareDialog
          document={selectedFile}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          onDocumentUpdate={(updatedDoc) => {
            onDocumentsChange(documents.map(doc => 
              doc.id === updatedDoc.id ? updatedDoc : doc
            ));
          }}
        />
      )}
    </Card>
  );
}
