
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Share, Users, File } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  ipAddress: string;
  details: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        // Mock data for demonstration
        setLogs([
          {
            id: '1',
            action: 'FILE_UPLOAD',
            user: 'john@company.com',
            target: 'document.pdf',
            timestamp: '2024-01-15T10:30:00Z',
            ipAddress: '192.168.1.100',
            details: 'Uploaded new document'
          },
          {
            id: '2',
            action: 'FILE_SHARE',
            user: 'jane@company.com',
            target: 'presentation.pptx',
            timestamp: '2024-01-15T09:45:00Z',
            ipAddress: '192.168.1.101',
            details: 'Shared with 3 users'
          },
          {
            id: '3',
            action: 'USER_LOGIN',
            user: 'mike@company.com',
            target: 'System',
            timestamp: '2024-01-15T08:15:00Z',
            ipAddress: '192.168.1.102',
            details: 'Successful login'
          },
          {
            id: '4',
            action: 'FILE_DOWNLOAD',
            user: 'sarah@company.com',
            target: 'report.xlsx',
            timestamp: '2024-01-14T16:20:00Z',
            ipAddress: '192.168.1.103',
            details: 'Downloaded shared document'
          },
          {
            id: '5',
            action: 'FILE_DELETE',
            user: 'admin@company.com',
            target: 'old_document.doc',
            timestamp: '2024-01-14T14:30:00Z',
            ipAddress: '192.168.1.104',
            details: 'Deleted outdated document'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'FILE_UPLOAD':
        return <Upload className="w-4 h-4" />;
      case 'FILE_SHARE':
        return <Share className="w-4 h-4" />;
      case 'FILE_DOWNLOAD':
        return <File className="w-4 h-4" />;
      case 'USER_LOGIN':
        return <Users className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'FILE_UPLOAD':
        return 'bg-green-100 text-green-800';
      case 'FILE_SHARE':
        return 'bg-blue-100 text-blue-800';
      case 'FILE_DOWNLOAD':
        return 'bg-purple-100 text-purple-800';
      case 'FILE_DELETE':
        return 'bg-red-100 text-red-800';
      case 'USER_LOGIN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit logs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Audit Logs ({logs.length})
          </CardTitle>
          <Input
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No logs found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'No audit logs available yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">{log.action.replace('_', ' ')}</h4>
                        <Badge variant="outline" className="text-xs">
                          {log.user}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Target: {log.target}</span>
                        <span>IP: {log.ipAddress}</span>
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
