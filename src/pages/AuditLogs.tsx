import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface AuditLog {
  _id: string;
  user: {
    _id: string;
    email: string;
  };
  action: string;
  resourceType: string;
  resourceId: string;
  status: string;
  details: Record<string, unknown>;
  createdAt: string;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const checkAdminStatus = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found in localStorage");
        return false;
      }

      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      console.log("Full token payload:", tokenPayload);
      console.log("User roles:", tokenPayload.roles);
      console.log(
        "Is admin check:",
        tokenPayload.roles && tokenPayload.roles.includes("admin")
      );

      // Check if user has admin role
      const isAdmin =
        tokenPayload.roles && tokenPayload.roles.includes("admin");
      console.log("Final admin status:", isAdmin);
      return isAdmin;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage");
        window.location.href = "/login";
        return;
      }

      // Check admin status first
      const hasAdminAccess = checkAdminStatus();
      console.log("Has admin access:", hasAdminAccess);
      setIsAdmin(hasAdminAccess);

      if (!hasAdminAccess) {
        console.log("User is not an admin, skipping audit logs fetch");
        return;
      }

      const API_URL =
        import.meta.env.VITE_API_URL ||
        "https://docsecure-backend.onrender.com";
      console.log("Using API URL:", API_URL);

      // Log the full request details
      console.log("Making request with headers:", {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      });

      const response = await axios.get(`${API_URL}/api/audit-logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      console.log("Audit logs fetch response:", response);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch audit logs");
      }

      setLogs(response.data.data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });

        // Handle 401/403 errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error("Authentication error - not an admin user");
          setIsAdmin(false);
          return;
        }
      }
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch audit logs. Please try again.",
        variant: "destructive",
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (loading) {
    return <div>Loading audit logs...</div>;
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive" className="mt-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You need administrator privileges to view audit logs. Please contact
          your system administrator if you believe this is an error.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Audit Logs</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log._id}>
              <TableCell>{format(new Date(log.createdAt), "PPpp")}</TableCell>
              <TableCell>{log.user.email}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>
                {log.resourceType} ({log.resourceId})
              </TableCell>
              <TableCell>{log.status}</TableCell>
              <TableCell>
                {log.details ? JSON.stringify(log.details) : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AuditLogs;
