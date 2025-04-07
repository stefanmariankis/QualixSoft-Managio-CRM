import { createContext, useContext, useState, ReactNode } from "react";
import { AuthState, User, Organization } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LoginData, RegistrationData } from "@shared/schema";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Omit<RegistrationData, 'email' | 'password'>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserData: (data: Partial<User>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => void;
}

interface AuthResponse {
  user: User;
  organization: Organization | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    organization: null,
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  // Folosim react-query pentru a verifica sesiunea
  const { refetch } = useQuery<AuthResponse>({
    queryKey: ['/api/me'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            setState(prev => ({ ...prev, loading: false, user: null, organization: null }));
            return { user: null, organization: null } as any;
          }
          throw new Error('Eroare la verificarea sesiunii');
        }
        
        const data = await response.json();
        setState({
          user: data.user,
          organization: data.organization,
          loading: false,
          error: null,
        });
        return data;
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'A apărut o eroare la verificarea sesiunii', 
          loading: false 
        }));
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Folosim mutații pentru operațiile de autentificare
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Autentificare eșuată' }));
          throw new Error(errorData.message || 'Autentificare eșuată');
        }
        
        const data = await response.json();
        setState({
          user: data.user,
          organization: data.organization,
          loading: false,
          error: null,
        });

        // Invalidăm query-ul curent pentru a forța o reîncărcare
        queryClient.invalidateQueries({ queryKey: ['/api/me'] });
        
        return data;
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: error instanceof Error ? error.message : 'Autentificare eșuată'
        }));
        throw error;
      }
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (regData: RegistrationData) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(regData),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Înregistrare eșuată' }));
          throw new Error(errorData.message || 'Înregistrare eșuată');
        }
        
        const data = await response.json();
        setState({
          user: data.user,
          organization: data.organization,
          loading: false,
          error: null,
        });

        // Invalidăm query-ul curent pentru a forța o reîncărcare
        queryClient.invalidateQueries({ queryKey: ['/api/me'] });
        
        return data;
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: error instanceof Error ? error.message : 'Înregistrare eșuată'
        }));
        throw error;
      }
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      setState(prev => ({ ...prev, loading: true }));
      
      try {
        const response = await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Deconectare eșuată' }));
          throw new Error(errorData.message || 'Deconectare eșuată');
        }
        
        setState({ 
          user: null, 
          organization: null,
          loading: false, 
          error: null 
        });

        // Invalidăm query-ul curent pentru a forța o reîncărcare
        queryClient.invalidateQueries({ queryKey: ['/api/me'] });
        
        return await response.json();
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: error instanceof Error ? error.message : 'Deconectare eșuată'
        }));
        throw error;
      }
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // În viitor, va exista un endpoint /api/reset-password
        // Deocamdată, simulăm comportamentul
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setState(prev => ({ ...prev, loading: false }));
        return { success: true };
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: error instanceof Error ? error.message : 'Resetare parolă eșuată'
        }));
        throw error;
      }
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      setState(prev => ({ ...prev, loading: true }));
      
      try {
        // În viitor, va exista un endpoint /api/user pentru actualizarea datelor
        // Deocamdată, simulăm comportamentul
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Actualizăm starea utilizatorului local
        setState(prev => ({
          ...prev,
          user: prev.user ? {
            ...prev.user,
            ...userData
          } : null,
          loading: false,
          error: null,
        }));
        
        return { success: true };
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: error instanceof Error ? error.message : 'Actualizare date eșuată'
        }));
        throw error;
      }
    }
  });

  // Funcții wrapper pentru a face API-ul mai ușor de utilizat
  const signIn = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password, rememberMe: true });
      toast({
        title: "Autentificare reușită",
        description: `Bine ai revenit, ${state.user?.first_name || 'utilizator'}!`,
      });
    } catch (error) {
      toast({
        title: "Autentificare eșuată",
        description: error instanceof Error ? error.message : 'Autentificare eșuată',
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: Omit<RegistrationData, 'email' | 'password'>) => {
    try {
      await registerMutation.mutateAsync({
        email,
        password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        organizationType: userData.organizationType,
        companyName: userData.companyName,
        termsAccepted: userData.termsAccepted
      });
      toast({
        title: "Cont creat cu succes",
        description: "Te-ai înregistrat cu succes în platforma Managio.",
      });
    } catch (error) {
      toast({
        title: "Înregistrare eșuată",
        description: error instanceof Error ? error.message : 'Înregistrare eșuată',
        variant: "destructive"
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Deconectat",
        description: "Te-ai deconectat cu succes.",
      });
    } catch (error) {
      toast({
        title: "Deconectare eșuată",
        description: error instanceof Error ? error.message : 'Deconectare eșuată',
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await resetPasswordMutation.mutateAsync(email);
      toast({
        title: "Email trimis",
        description: "Un email pentru resetarea parolei a fost trimis la adresa ta.",
      });
    } catch (error) {
      toast({
        title: "Resetare parolă eșuată",
        description: error instanceof Error ? error.message : 'Resetare parolă eșuată',
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateUserData = async (data: Partial<User>) => {
    try {
      await updateUserMutation.mutateAsync(data);
      toast({
        title: "Profil actualizat",
        description: "Datele tale au fost actualizate cu succes.",
      });
    } catch (error) {
      toast({
        title: "Actualizare eșuată",
        description: error instanceof Error ? error.message : 'Actualizare date eșuată',
        variant: "destructive"
      });
      throw error;
    }
  };

  const refreshUserData = async () => {
    await refetch();
  };

  const updateOrganization = (data: Partial<Organization>) => {
    setState(prev => ({
      ...prev,
      organization: prev.organization ? { ...prev.organization, ...data } : null
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserData,
        refreshUserData,
        updateOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
