import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, Shield, Eye, Edit3, Trash2, 
  Crown, User, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'analyst' | 'viewer';
  created_at: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

const roleDefinitions = {
  admin: {
    name: 'Administrator',
    description: 'Full access to all features, user management, and system settings',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    icon: Crown,
    permissions: ['Manage users', 'View all reports', 'Upload files', 'System settings', 'Analytics access']
  },
  analyst: {
    name: 'ESG Analyst',
    description: 'Can upload files, generate reports, and access advanced analytics',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    icon: Edit3,
    permissions: ['Upload files', 'Generate reports', 'View own reports', 'Basic analytics', 'AI chat access']
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to reports and basic analytics',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    icon: Eye,
    permissions: ['View assigned reports', 'Basic analytics', 'Download reports', 'AI chat access']
  }
};

export const UserRoleManager = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    if (user) {
      checkCurrentUserRole();
      fetchUserRoles();
    }
  }, [user]);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url');

      if (profilesError) throw profilesError;

      // Join the data
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const enrichedRoles = rolesData?.map(role => {
        const profile = profilesMap.get(role.user_id);
        return {
          ...role,
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
        };
      }) || [];

      setUserRoles(enrichedRoles);
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "Error Loading Users",
        description: error.message || "Failed to load user roles.",
        variant: "destructive",
      });
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking user role:', error);
        setCurrentUserRole('viewer');
        return;
      }
      
      setCurrentUserRole(data?.role || 'viewer');
    } catch (error) {
      console.error('Error checking user role:', error);
      setCurrentUserRole('viewer');
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'analyst' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
      });

      await fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const removeUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({
        title: "Error",
        description: "You cannot remove yourself from the system.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User Removed",
        description: "User has been removed from the system.",
      });

      await fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = userRoles.filter(userRole => {
    const userName = userRole.full_name || 'Unknown User';
    const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || userRole.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Only show to admin users
  if (currentUserRole !== 'admin') {
    return (
      <Card className="gradient-card border-0 shadow-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground text-center max-w-md">
            User role management is only available to administrators. Contact your admin if you need access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className="gradient-card border-0 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>User Role Management</CardTitle>
                <CardDescription>
                  Manage user permissions and access levels across PrakritiLens
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary">
              {userRoles.length} Users
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Role Definitions */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(roleDefinitions).map(([key, role]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="gradient-card border-0 shadow-card h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${role.bgColor} rounded-lg flex items-center justify-center`}>
                    <role.icon className={`w-5 h-5 ${role.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {role.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {role.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3" />
                      {permission}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* User Management */}
      <Card className="gradient-card border-0 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Users</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="analyst">Analysts</SelectItem>
                  <SelectItem value="viewer">Viewers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading users...</p>
                </div>
              )}

              {!loading && filteredUsers.map((userRole, index) => {
                const roleInfo = roleDefinitions[userRole.role];
                if (!roleInfo) return null;
                
                return (
                  <motion.div
                    key={userRole.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {userRole.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Added {new Date(userRole.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant={userRole.role === 'admin' ? 'destructive' : userRole.role === 'analyst' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        <roleInfo.icon className="w-3 h-3 mr-1" />
                        {roleInfo.name}
                      </Badge>

                      {userRole.user_id !== user?.id && (
                        <div className="flex items-center space-x-2">
                          <Select
                            value={userRole.role}
                            onValueChange={(newRole: 'admin' | 'analyst' | 'viewer') => 
                              updateUserRole(userRole.user_id, newRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="analyst">Analyst</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUser(userRole.user_id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {!loading && filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery || selectedRole !== 'all' 
                      ? 'No users match your search criteria.' 
                      : 'User role system is being set up. Please refresh in a moment.'
                    }
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};