import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import supabase from "@/lib/supabase";
import { AuthState, SupabaseUser } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserData: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Verifică sesiunea curentă
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, loading: false }));
          return;
        }

        if (data?.session) {
          const { data: userData } = await supabase.auth.getUser();
          setState({
            user: userData?.user as SupabaseUser || null,
            loading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'A apărut o eroare la verificarea sesiunii', 
          loading: false 
        }));
      }
    };

    checkSession();

    // Ascultă pentru schimbări în autentificare
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setState({
            user: session.user as SupabaseUser,
            loading: false,
            error: null,
          });
        } else {
          setState(prev => ({ ...prev, user: null, loading: false }));
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setState({
        user: data.user as SupabaseUser,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Autentificare eșuată', 
        loading: false 
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) throw error;

      // Afișăm un mesaj de succes chiar dacă utilizatorul ar putea necesita confirmare email
      toast({
        title: "Cont creat cu succes",
        description: "Te-ai înregistrat cu succes. Verifică email-ul pentru confirmarea contului.",
      });

      if (data.user) {
        setState({
          user: data.user as SupabaseUser,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Înregistrare eșuată', 
        loading: false 
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await supabase.auth.signOut();
      setState({ user: null, loading: false, error: null });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Deconectare eșuată', 
        loading: false 
      }));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      setState(prev => ({ ...prev, loading: false }));
      toast({
        title: "Email trimis",
        description: "Un email pentru resetarea parolei a fost trimis la adresa ta.",
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Resetare parolă eșuată', 
        loading: false 
      }));
      throw error;
    }
  };

  const updateUserData = async (data: any) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const { error } = await supabase.auth.updateUser({
        data
      });
      
      if (error) throw error;
      
      // Actualizează starea utilizatorului
      const { data: userData } = await supabase.auth.getUser();
      setState({
        user: userData?.user as SupabaseUser || null,
        loading: false,
        error: null,
      });
      
      toast({
        title: "Profil actualizat",
        description: "Datele tale au fost actualizate cu succes.",
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Actualizare date eșuată', 
        loading: false 
      }));
      throw error;
    }
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
