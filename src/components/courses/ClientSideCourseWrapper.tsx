import React, {useEffect, useState } from 'react';
import ClientSideMuiProvider from '@/components/mui/ClientSideMuiProvider';

interface ClientSideCourseWrapperProps {
  children: React.ReactNode;
}

const ClientSideCourseWrapper: React.FC<ClientSideCourseWrapperProps> = ({children }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
}, []);

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center p-8 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  return <ClientSideMuiProvider>{children}</ClientSideMuiProvider>;
};

export default ClientSideCourseWrapper;
