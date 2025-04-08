/**
 * Client API pentru comunicarea cu backend-ul Managio
 * Acest modul gestionează comunicarea cross-domain între frontend și backend
 */

// URL-ul de bază al API-ului backend
const getApiBaseUrl = (): string => {
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    // În producție, folosim URL-ul API-ului de pe Railway
    return 'https://managiosync-production.up.railway.app';
  } else {
    // În dezvoltare, folosim serverul local
    return '';
  }
};

// Headers standard pentru cereri
const getDefaultHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

// Opțiuni implicite pentru fetch
const getDefaultOptions = (): RequestInit => ({
  credentials: 'include', // Important pentru cookies de sesiune cross-domain
  headers: getDefaultHeaders(),
});

// Funcție pentru construirea URL-ului complet
const buildUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

// Funcție pentru cereri GET
export const apiGet = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = buildUrl(path);
  const response = await fetch(url, {
    ...getDefaultOptions(),
    ...options,
    method: 'GET',
  });

  if (!response.ok) {
    throw await handleApiError(response);
  }

  return await response.json() as T;
};

// Funcție pentru cereri POST
export const apiPost = async <T>(path: string, data?: any, options: RequestInit = {}): Promise<T> => {
  const url = buildUrl(path);
  const response = await fetch(url, {
    ...getDefaultOptions(),
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw await handleApiError(response);
  }

  return await response.json() as T;
};

// Funcție pentru cereri PUT
export const apiPut = async <T>(path: string, data?: any, options: RequestInit = {}): Promise<T> => {
  const url = buildUrl(path);
  const response = await fetch(url, {
    ...getDefaultOptions(),
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw await handleApiError(response);
  }

  return await response.json() as T;
};

// Funcție pentru cereri DELETE
export const apiDelete = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = buildUrl(path);
  const response = await fetch(url, {
    ...getDefaultOptions(),
    ...options,
    method: 'DELETE',
  });

  if (!response.ok) {
    throw await handleApiError(response);
  }

  return await response.json() as T;
};

// Funcție pentru gestionarea erorilor API
export const handleApiError = async (response: Response): Promise<Error> => {
  let errorMessage = `Eroare ${response.status}`;
  
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorMessage;
  } catch (e) {
    // Ignorăm erorile de parsare a răspunsului
  }

  // Creăm un obiect de eroare cu informații suplimentare
  const error = new Error(errorMessage);
  (error as any).status = response.status;
  (error as any).statusText = response.statusText;
  
  return error;
};

// Funcție pentru verificarea stării API-ului
export const checkApiStatus = async (): Promise<{ status: string, version: string }> => {
  try {
    return await apiGet<{ status: string, version: string }>('/api/status');
  } catch (error) {
    console.error('Eroare la verificarea stării API-ului:', error);
    return { status: 'offline', version: 'necunoscută' };
  }
};

// Exportăm clientul API complet
const apiClient = {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  checkStatus: checkApiStatus,
  baseUrl: getApiBaseUrl,
};

export default apiClient;