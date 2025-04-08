import { QueryClient, QueryFunction } from "@tanstack/react-query";

// URL-ul backend-ului Railway
const API_BASE_URL = "https://managiosync-production.up.railway.app";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Construiește URL-ul complet doar dacă endpoint-ul nu este deja URL complet
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Asigurăm-ne că URL-ul nu conține // (double slashes)
  const cleanUrl = fullUrl.replace(/([^:]\/)\/+/g, "$1");
  console.log(`API Request: ${method} ${cleanUrl}`);
  
  try {
    const res = await fetch(cleanUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API Request Error: ${method} ${cleanUrl}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Verifică dacă queryKey-ul este un string (endpoint)
    const urlKey = queryKey[0] as string;
    
    // Construiește URL-ul complet doar dacă nu începe deja cu http
    const fullUrl = urlKey.startsWith('http') ? urlKey : `${API_BASE_URL}${urlKey}`;
    
    // Asigurăm-ne că URL-ul nu conține // (double slashes)
    const cleanUrl = fullUrl.replace(/([^:]\/)\/+/g, "$1");
    console.log(`Query Request: GET ${cleanUrl}`);
    
    try {
      const res = await fetch(cleanUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query Request Error: GET ${cleanUrl}`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
