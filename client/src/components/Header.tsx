import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  user: User | undefined;
  onLogin: () => void;
  onLogout: () => void;
}

export function Header({ user, onLogin, onLogout }: HeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          数独<span className="text-primary">アプリ</span>
        </h1>
        
        {user ? (
          <div className="flex items-center">
            <span className="mr-3 text-gray-700">{user.username}</span>
            <button 
              onClick={onLogout}
              className="text-secondary hover:text-red-500"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <Button 
            onClick={onLogin}
            className="bg-primary hover:bg-blue-600 text-white"
          >
            サインイン
          </Button>
        )}
      </div>
    </header>
  );
}
