import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

interface FileUploadAreaProps {
  onFileUpload: (file: DocumentFile) => void;
}

export function FileUploadArea({ onFileUpload }: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        throw new Error("File size exceeds 10MB limit");
      }

      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "image/jpeg",
        "image/png",
        "image/gif",
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error("File type not supported");
      }

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const API_URL =
        import.meta.env.VITE_API_URL ||
        "https://docsecure-backend.onrender.com";
      console.log("Uploading to:", `${API_URL}/api/documents/upload`);

      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await response.json();
          console.error("Server response:", errorData);
          errorMessage =
            errorData.message ||
            `Upload failed: ${response.status} ${response.statusText}`;
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Upload response:", result);

      if (result.success && result.data) {
        onFileUpload(result.data);
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } else {
        throw new Error(result.message || "Invalid response from server");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
      <CardContent className="p-8">
        <div
          className={`text-center ${
            isDragging ? "bg-blue-50" : ""
          } transition-colors rounded-lg p-6`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload files
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your files here, or click to browse
          </p>

          <div className="space-y-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center">
                  <File className="w-4 h-4 mr-2" />
                  Choose files
                </div>
              )}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, Images
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
