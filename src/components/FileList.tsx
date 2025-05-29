import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Share2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/ShareDialog";

interface DocumentFile {
  _id: string;
  name: string;
  originalname?: string;
  description?: string;
  type: string;
  fileType?: string;
  size: number;
  fileSize?: number;
  uploadedAt: string;
  createdAt?: string;
  tags?: string[];
  sharedWith?: Array<{
    user: string;
    accessType: string;
  }>;
  owner?: {
    _id: string;
    email: string;
    name: string;
  };
}

interface FileListProps {
  documents: DocumentFile[];
  onDelete: (id: string) => void;
  onShare: (document: DocumentFile) => void;
  onDownload: (id: string) => void;
  loading?: boolean;
}

export const FileList = ({
  documents,
  onDelete,
  onShare,
  onDownload,
  loading = false,
}: FileListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(
    null
  );
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();

  const handleShare = (document: DocumentFile) => {
    setSelectedDocument(document);
    setShowShareDialog(true);
  };

  const handleShareSuccess = () => {
    setShowShareDialog(false);
    setSelectedDocument(null);
    if (onShare) {
      onShare(selectedDocument!);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || isNaN(bytes)) return "N/A";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (document: DocumentFile) => {
    if (document.type) return document.type;
    if (document.fileType) return document.fileType;
    if (document.name) {
      const extension = document.name.split(".").pop()?.toLowerCase();
      return extension || "Unknown";
    }
    return "Unknown";
  };

  const getAccessType = (document: DocumentFile) => {
    const token = localStorage.getItem("token");
    if (!token) return "No Access";
    const tokenPayload = JSON.parse(atob(token.split(".")[1]));
    const userId = tokenPayload.userId || tokenPayload.id;

    if (document.owner?._id === userId) {
      return "Owner";
    }

    const share = document.sharedWith?.find((share) => share.user === userId);
    return share ? share.accessType : "No Access";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search documents..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Access</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.map((document) => {
            const accessType = getAccessType(document);
            const isOwner = accessType === "Owner";
            const token = localStorage.getItem("token");
            const tokenPayload = token
              ? JSON.parse(atob(token.split(".")[1]))
              : null;
            const userId = tokenPayload?.userId || tokenPayload?.id;

            return (
              <TableRow key={document._id}>
                <TableCell>{document.name}</TableCell>
                <TableCell>{getFileType(document)}</TableCell>
                <TableCell>
                  {formatFileSize(document.size || document.fileSize)}
                </TableCell>
                <TableCell>
                  {formatDate(document.uploadedAt || document.createdAt)}
                </TableCell>
                <TableCell>{document.owner?.email || "Unknown"}</TableCell>
                <TableCell>{accessType}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(document._id)}
                    >
                      Download
                    </Button>
                    {isOwner && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(document)}
                        >
                          Share
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(document._id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedDocument && (
        <ShareDialog
          document={selectedDocument}
          open={showShareDialog}
          onOpenChange={(open) => {
            setShowShareDialog(open);
            if (!open) {
              setSelectedDocument(null);
            }
          }}
          onShareSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
};
