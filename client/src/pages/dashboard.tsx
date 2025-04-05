import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user, organization, signOut } = useAuth();
  
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
                {user?.first_name || ''} {user?.last_name || ''}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <Button variant="ghost" onClick={signOut}>Deconectare</Button>
          </div>
        </header>
        
        <main className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Bine ai venit pe Managio, {user?.first_name || 'utilizator'}!
          </h2>
          
          {organization && (
            <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Organizația ta</h3>
              <p className="text-sm text-gray-600">Nume: <span className="font-medium">{organization.name}</span></p>
              <p className="text-sm text-gray-600">Tip: <span className="font-medium">{organization.organization_type}</span></p>
              <p className="text-sm text-gray-600">Plan: <span className="font-medium">{organization.subscription_plan}</span></p>
              {organization.trial_expires_at && (
                <p className="text-sm text-gray-600 mt-2">
                  Perioada de probă expiră la: {' '}
                  <span className="font-medium">
                    {new Date(organization.trial_expires_at).toLocaleDateString('ro-RO')}
                  </span>
                </p>
              )}
            </div>
          )}
          
          <p className="text-gray-600 mb-4">
            Ești acum conectat la Dashboard. Aici vei putea gestiona proiecte, clienți, facturi și multe altele.
          </p>
          <p className="text-gray-600">
            În curând vom adăuga toate funcționalitățile platformei Managio:
          </p>
          <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
            <li>Management de proiecte</li>
            <li>Gestionarea clienților</li>
            <li>Facturare și plăți</li>
            <li>Template-uri documente</li>
            <li>Rapoarte și statistici</li>
          </ul>
        </main>
      </div>
    </div>
  );
}
