import { ReactNode } from "react";
import { Link } from "wouter";
import Logo from "@/components/ui/logo";

interface AuthLayoutProps {
  children: ReactNode;
  activeTab: 'login' | 'register' | 'forgot-password';
}

export default function AuthLayout({ children, activeTab }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="lg:grid lg:grid-cols-2 lg:gap-0 w-full max-w-7xl shadow-xl rounded-xl overflow-hidden">
        {/* Left side - Auth form */}
        <div className="p-6 sm:p-10 md:p-12 bg-white flex flex-col justify-between">
          {/* Auth Header */}
          <div className="mb-8">
            <div className="flex items-center mb-8">
              <Logo />
              <h1 className="text-3xl font-bold text-gray-900 ml-2">Managio</h1>
            </div>
            
            {/* Auth Tabs - Only show if not on forgot password */}
            {activeTab !== 'forgot-password' && (
              <div className="flex border-b border-gray-200 mb-8">
                <Link href="/auth/login" className={`py-2 px-4 font-medium ${activeTab === 'login' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-800'}`}>
                  Autentificare
                </Link>
                <Link href="/auth/register" className={`py-2 px-4 font-medium ${activeTab === 'register' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-800'}`}>
                  Înregistrare
                </Link>
              </div>
            )}
          </div>
          
          {/* Auth form content */}
          <div className="flex-grow">
            {children}
          </div>
          
          {/* Auth Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Managio © {new Date().getFullYear()} - Platformă CRM & Project Management
            </p>
          </div>
        </div>
        
        {/* Right side - Image and features */}
        <div className="hidden lg:block relative bg-gradient-to-r from-primary/80 to-primary-dark/90">
          <div className="absolute inset-0 flex flex-col justify-between p-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Bine ai venit în Managio</h2>
              <p className="text-white/80 text-lg mb-8">Platforma completă de CRM și Project Management pentru afacerea ta</p>
              
              <div className="space-y-6 mt-12">
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded-lg mr-4">
                    <i className="fas fa-tasks text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">Gestionare de proiecte</h3>
                    <p className="text-white/70">Organizează, planifică și execută proiectele eficient</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded-lg mr-4">
                    <i className="fas fa-clock text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">Monitorizare timp</h3>
                    <p className="text-white/70">Urmărește timpul alocat pentru sarcini și proiecte</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-white/10 p-2 rounded-lg mr-4">
                    <i className="fas fa-file-invoice text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg">Facturare simplă</h3>
                    <p className="text-white/70">Generează facturi profesionale și primește plăți online</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <i className="fab fa-facebook-f text-white"></i>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <i className="fab fa-linkedin-in text-white"></i>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <i className="fab fa-instagram text-white"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
