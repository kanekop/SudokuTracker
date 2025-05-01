import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void;
  isLoading: boolean;
}

export function LoginModal({ isOpen, onClose, onLogin, isLoading }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }
    
    onLogin(username);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">サインイン</DialogTitle>
          <DialogDescription className="text-gray-600">
            プレイヤー名を入力してください。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="player-name" className="block text-gray-700 mb-2">
              名前
            </Label>
            <Input
              id="player-name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="山田太郎"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="mr-2"
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'サインイン'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
