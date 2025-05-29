import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

interface Document {
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

interface ShareDialogProps {
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareSuccess?: () => void;
}

export function ShareDialog({
  document,
  open,
  onOpenChange,
  onShareSuccess,
}: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [accessType, setAccessType] = useState("view");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // First, get the user ID from the email
      const userResponse = await fetch(
        `https://docsecure-backend.onrender.com/api/users/by-email/${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!userResponse.ok) {
        throw new Error("User not found with this email address");
      }

      const userData = await userResponse.json();
      if (!userData.success || !userData.data) {
        throw new Error("Failed to find user");
      }

      const userId = userData.data._id;

      // Now share the document with the user
      const response = await fetch(
        `https://docsecure-backend.onrender.com/api/documents/${document._id}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            accessType,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to share document");
      }

      toast({
        title: "Success",
        description: "Document shared successfully",
      });
      onOpenChange(false);
      setEmail("");
      onShareSuccess?.();
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to share document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Share "{document.name || document.originalname}" with another user
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access">Access Type</Label>
            <Select value={accessType} onValueChange={setAccessType}>
              <SelectTrigger>
                <SelectValue placeholder="Select access type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="edit">Can Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={loading}>
            {loading ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
