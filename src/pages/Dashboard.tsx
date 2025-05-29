
import React, { useState, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FileUploadArea } from "@/components/FileUploadArea";
import { FileList } from "@/components/FileList";
import { AuditLogs } from "@/components/AuditLogs";
import { UserManagement } from "@/components/UserManagement";

type Document = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  shared: boolean;
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('files');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (newFile: Document) => {
    setDocuments(prev => [newFile, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'files':
        return (
          <div className="space-y-6">
            <FileUploadArea onFileUpload={handleFileUpload} />
            <FileList documents={documents} onDocumentsChange={setDocuments} loading={loading} />
          </div>
        );
      case 'users':
        return <UserManagement />;
      case 'audit':
        return <AuditLogs />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
