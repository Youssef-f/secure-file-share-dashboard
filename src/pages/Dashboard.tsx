import React, { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FileUploadArea } from "@/components/FileUploadArea";
import { FileList } from "@/components/FileList";
import { AuditLogs } from "@/components/AuditLogs";
import { UserManagement } from "@/components/UserManagement";
import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/ShareDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";

type DocumentFile = {
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
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("files");
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(
    null
  );
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage");
        window.location.href = "/login";
        return;
      }

      // Get the current user's ID from the token
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const userId = tokenPayload.userId || tokenPayload.id;
      console.log("Current user ID:", userId);

      const API_URL =
        import.meta.env.VITE_API_URL ||
        "https://docsecure-backend.onrender.com";
      console.log("Using API URL:", API_URL);

      const response = await axios.get(`${API_URL}/api/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      console.log("Document fetch response:", response);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch documents");
      }

      const result = response.data.data;
      console.log("API Response:", result);

      if (Array.isArray(result)) {
        setDocuments(result);
      } else {
        console.error("Invalid response format:", result);
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });

        // Handle 401/403 errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error("Authentication error - redirecting to login");
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
      }
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch documents. Please try again.",
        variant: "destructive",
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (newFile: DocumentFile) => {
    try {
      setDocuments((prev) => [newFile, ...prev]);
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error) {
      console.error("Error handling file upload:", error);
      toast({
        title: "Error",
        description: "Failed to process uploaded document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const API_URL =
        import.meta.env.VITE_API_URL ||
        "https://docsecure-backend.onrender.com";
      console.log("Deleting document:", id, "from API:", API_URL);

      const response = await axios.delete(`${API_URL}/api/documents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Delete response:", response);

      if (response.data.success) {
        // Remove the document from the local state
        setDocuments((prev) => prev.filter((doc) => doc._id !== id));

        toast({
          title: "Success",
          description: "Document deleted successfully",
        });

        // Refresh the document list
        await fetchDocuments();
      } else {
        throw new Error(response.data.message || "Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      if (axios.isAxiosError(error)) {
        console.error("Delete error details:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
      }
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleShare = (document: DocumentFile) => {
    setSelectedDocument(document);
    setShowShareDialog(true);
  };

  const handleShareSuccess = async () => {
    try {
      await fetchDocuments(); // Refresh the entire document list
      toast({
        title: "Success",
        description: "Document list refreshed",
      });
    } catch (error) {
      console.error("Error refreshing documents:", error);
      toast({
        title: "Error",
        description: "Failed to refresh document list",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/documents/${id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = documents.find((doc) => doc._id === id)?.name || "document";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getOwnedDocuments = () => {
    const token = localStorage.getItem("token");
    if (!token) return [];
    const tokenPayload = JSON.parse(atob(token.split(".")[1]));
    const userId = tokenPayload.userId || tokenPayload.id;
    console.log("Getting owned documents for user:", userId);
    return documents.filter((doc) => doc.owner?._id === userId);
  };

  const getSharedDocuments = () => {
    const token = localStorage.getItem("token");
    if (!token) return [];
    const tokenPayload = JSON.parse(atob(token.split(".")[1]));
    const userId = tokenPayload.userId || tokenPayload.id;
    console.log("Getting shared documents for user:", userId);
    return documents.filter((doc) => {
      const isShared =
        doc.owner?._id !== userId &&
        doc.sharedWith?.some((share) => share.user === userId);
      return isShared;
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "files":
        return (
          <div className="space-y-6">
            <FileUploadArea onFileUpload={handleFileUpload} />
            <Tabs defaultValue="owned" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="owned">My Documents</TabsTrigger>
                <TabsTrigger value="shared">Shared with Me</TabsTrigger>
              </TabsList>
              <TabsContent value="owned">
                <FileList
                  documents={getOwnedDocuments()}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onDownload={handleDownload}
                  loading={loading}
                />
              </TabsContent>
              <TabsContent value="shared">
                <FileList
                  documents={getSharedDocuments()}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onDownload={handleDownload}
                  loading={loading}
                />
              </TabsContent>
            </Tabs>
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
      case "users":
        return <UserManagement />;
      case "audit":
        return <AuditLogs />;
      default:
        return null;
    }
  };

  // Add useEffect to handle document list updates
  useEffect(() => {
    if (documents.length > 0) {
      console.log("Documents updated:", documents);
    }
  }, [documents]);

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-100">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
