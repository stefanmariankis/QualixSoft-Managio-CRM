import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  
  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <header className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <h1 className="text-xl font-bold text-gray-900">Managio</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.user_metadata?.firstName} {user?.user_metadata?.lastName}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Button variant="ghost" onClick={signOut}>Deconectare</Button>
          </div>
        </header>
        
        <main className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bine ai venit pe Managio</h2>
          <p className="text-gray-600 mb-4">
            Ești acum conectat la Dashboard. Aici vei putea gestiona proiecte, clienți, facturi și multe altele.
          </p>
          <p className="text-gray-600">
            În curând vom adăuga toate funcționalitățile platformei Managio.
          </p>
        </main>
      </div>
    </div>
  );
}
