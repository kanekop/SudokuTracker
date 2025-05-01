import { useState } from 'react';
import { useLocation, Link } from 'wouter';

interface TabsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  const [location, setLocation] = useLocation();
  
  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setLocation(tab === 'game' ? '/' : '/history');
  };
  
  return (
    <div className="flex border-b border-gray-medium mb-6">
      <button 
        className={`px-4 py-2 border-b-2 ${
          activeTab === 'game' 
            ? 'border-primary text-primary font-medium' 
            : 'border-transparent hover:text-primary text-gray-500 font-medium'
        }`}
        onClick={() => handleTabClick('game')}
      >
        ゲーム
      </button>
      <button 
        className={`px-4 py-2 border-b-2 ${
          activeTab === 'history' 
            ? 'border-primary text-primary font-medium' 
            : 'border-transparent hover:text-primary text-gray-500 font-medium'
        }`}
        onClick={() => handleTabClick('history')}
      >
        履歴
      </button>
    </div>
  );
}
