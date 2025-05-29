
import React, { useState } from 'react';
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

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  shared: boolean;
}

interface ShareDialogProps {
  document: Document;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUpdate: (document: Document) => void;
}

export function ShareDialog({ document, open, onOpenChange, onDocumentUpdate }: ShareDialogProps) {
  const [emails, setEmails] = useState('');
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!emails.trim()) {
      toast({
        title: "Email required",
        description: "Please enter at least one email address.",
        variant: "destructive",
      });
      return;
    }

    setSharing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${document.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          emails: emails.split(',').map(email => email.trim()),
          message: message.trim(),
        }),
      });
      
      if (response.ok) {
        const updatedDocument = { ...document, shared: true };
        onDocumentUpdate(updatedDocument);
        
        toast({
          title: "File shared successfully",
          description: `${document.name} has been shared with the specified users.`,
        });
        
        onOpenChange(false);
        setEmails('');
        setMessage('');
      } else {
        throw new Error('Sharing failed');
      }
    } catch (error) {
      toast({
        title: "Sharing failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{document.name}"</DialogTitle>
          <DialogDescription>
            Share this file with other users in your organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emails">Email addresses</Label>
            <Input
              id="emails"
              placeholder="Enter email addresses separated by commas"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Separate multiple emails with commas
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message for the recipients..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 pt-4">
          <Button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1"
          >
            {sharing ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sharing...
              </div>
            ) : (
              'Share File'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sharing}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
