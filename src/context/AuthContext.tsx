import { createContext, useContext, useEffect, useState } from 'react';
import { account } from '@/integrations/appwrite/client';
import { Models } from 'appwrite';
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  currentUser: Models.User<Models.Preferences> | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await account.createEmailSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
      toast({
        title: "Success",
        description: "You have successfully signed in",
      });
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await account.deleteSession('current');
      setUser(null);
      toast({
        title: "Success",
        description: "You have successfully signed out",
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, currentUser: user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
