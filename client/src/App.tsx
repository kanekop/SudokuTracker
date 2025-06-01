import { useState, useEffect } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header, TabsNavigation } from '@/components/layout';
import { LoginModal } from '@/components/modals';
import { useAuth } from '@/hooks/useAuth';
import Game from '@/pages/Game';
import History from '@/pages/History';
import NotFound from '@/pages/not-found';

function App() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('game');
  const { 
    user, 
    isLoggedIn, 
    login, 
    logout, 
    isAuthModalOpen, 
    openAuthModal, 
    closeAuthModal 
  } = useAuth();
  
  // Set active tab based on location
  useEffect(() => {
    if (location === '/') {
      setActiveTab('game');
    } else if (location === '/history') {
      setActiveTab('history');
    }
  }, [location]);
  
  const handleLogin = (username: string) => {
    login.mutate(username);
  };
  
  const handleLogout = () => {
    logout.mutate();
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Header 
        user={user} 
        onLogin={openAuthModal} 
        onLogout={handleLogout} 
      />
      
      <TabsNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      
      <main>
        <Switch>
          <Route path="/" component={Game} />
          <Route path="/history" component={History} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <LoginModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        onLogin={handleLogin}
        isLoading={login.isPending}
      />
    </div>
  );
}

function AppWithProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <App />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default AppWithProviders;
