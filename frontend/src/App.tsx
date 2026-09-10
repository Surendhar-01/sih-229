import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import './i18n/i18n';
import { useAuthStore } from './store/authStore';
import i18n from './i18n/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const initSession = useAuthStore((state) => state.initSession);
  const language = useAuthStore((state) => state.language);

  useEffect(() => {
    void initSession();
  }, [initSession]);

  // Keep all routed pages, assistive technology and i18next on the same
  // selected language, including after a page refresh or profile update.
  useEffect(() => {
    const activeLanguage = language === 'hi' || language === 'mr' ? language : 'en';
    document.documentElement.lang = activeLanguage;
    if (i18n.language !== activeLanguage) void i18n.changeLanguage(activeLanguage);
  }, [language]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
