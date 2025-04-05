import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthState, User, Organization } from "@/types";
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
    organization: null,
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Verifică sesiunea curentă
    const checkSession = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        // Folosim API-ul nostru pentru a verifica sesiunea
        let response;
        try {
          response = await fetch('/api/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Importante pentru a trimite cookie-urile
          });
        } catch (fetchError) {
          console.error('Eroare de conexiune:', fetchError);
          setState(prev => ({ ...prev, loading: false }));
          return;
        }
        
        if (!response.ok) {
          if (response.status === 401) {
            // Utilizatorul nu este autentificat, ceea ce este normal
            setState(prev => ({ ...prev, loading: false }));
            return;
          }
          
          // Altă eroare
          let errorMessage = 'Eroare la verificarea sesiunii';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {}
          
          setState(prev => ({ 
            ...prev, 
            error: errorMessage, 
            loading: false 
          }));
          return;
        }
        
        // Avem un utilizator logat
        const data = await response.json();
        setState({
          user: data.user,
          organization: data.organization,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'A apărut o eroare la verificarea sesiunii', 
          loading: false 
        }));
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      let response;
      try {
        response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });
      } catch (fetchError) {
        throw new Error("Conexiune eșuată la server");
      }
      
      if (!response.ok) {
        let errorMessage = 'Autentificare eșuată';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      setState({
        user: data.user,
        organization: data.organization,
        loading: false,
        error: null,
      });
      
      // Afișăm un mesaj de succes
      toast({
        title: "Autentificare reușită",
        description: `Bine ai revenit, ${data.user.first_name || 'utilizator'}!`,
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
      
      // Înregistrare directă utilizator cu toate datele
      let registerResponse;
      try {
        registerResponse = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            organizationType: userData.organizationType,
            companyName: userData.companyName,
            termsAccepted: userData.termsAccepted
          }),
          credentials: 'include',
        });
      } catch (fetchError) {
        throw new Error("Conexiune eșuată la server");
      }
      
      if (!registerResponse.ok) {
        let errorMessage = 'Înregistrare eșuată';
        try {
          const errorData = await registerResponse.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      
      const data = await registerResponse.json();
      
      // Afișăm un mesaj de succes
      toast({
        title: "Cont creat cu succes",
        description: "Te-ai înregistrat cu succes.",
      });
      
      setState({
        user: data.user,
        organization: data.organization,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Eroare înregistrare:', error);
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
      
      let response;
      try {
        response = await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
      } catch (fetchError) {
        throw new Error("Conexiune eșuată la server");
      }
      
      if (!response.ok) {
        let errorMessage = 'Deconectare eșuată';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }
      
      setState({ 
        user: null, 
        organization: null,
        loading: false, 
        error: null 
      });
      
      // Afișăm un mesaj de succes
      toast({
        title: "Deconectat",
        description: "Te-ai deconectat cu succes.",
      });
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
      
      // Notă: În viitor, vom implementa un endpoint /api/reset-password
      // Deocamdată, doar simulăm funcționalitatea
      
      // Simulăm un delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      
      // Notă: În viitor, vom implementa un endpoint /api/user pentru actualizarea datelor
      // Deocamdată, doar simulăm funcționalitatea
      
      // Simulăm un delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizăm starea utilizatorului local
      setState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          ...data
        } : null,
        loading: false,
        error: null,
      }));
      
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
