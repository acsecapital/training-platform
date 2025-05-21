import React, {createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue, 
  children, 
  className = '', 
  onValueChange 
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
  }
};

  return (
    <TabsContext.Provider value={{activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({children, className = ''}) => {
  return (
    <div className={`flex border-b border-neutral-200 ${className}`}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value, 
  children, 
  className = '',
  onClick
}) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
}
  
  const {activeTab, setActiveTab } = context;
  const isActive = activeTab === value;
  
  const handleClick = () => {
    setActiveTab(value);
    if (onClick) {
      onClick();
  }
};
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      className={`px-4 py-2 text-sm font-medium ${
        isActive 
          ? 'text-primary border-b-2 border-primary' 
          : 'text-neutral-500 hover:text-neutral-700'
    } ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value, 
  children, 
  className = '' 
}) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
}
  
  const {activeTab } = context;
  const isActive = activeTab === value;
  
  if (!isActive) {
    return null;
}
  
  return (
    <div
      role="tabpanel"
      data-state={isActive ? 'active' : 'inactive'}
      className={className}
    >
      {children}
    </div>
  );
};

