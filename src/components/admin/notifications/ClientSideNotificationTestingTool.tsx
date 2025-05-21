import React from 'react';
import dynamic from 'next/dynamic';
import ClientSideMuiProvider from '@/components/mui/ClientSideMuiProvider';

// Dynamically import the NotificationTestingTool with SSR disabled
const NotificationTestingTool = dynamic(
  () => import('./NotificationTestingTool'),
  {ssr: false }
);

interface ClientSideNotificationTestingToolProps {
  onClose?: () => void;
}

const ClientSideNotificationTestingTool: React.FC<ClientSideNotificationTestingToolProps> = ({onClose }) => {
  return (
    <ClientSideMuiProvider>
      <NotificationTestingTool onClose={onClose} />
    </ClientSideMuiProvider>
  );
};

export default ClientSideNotificationTestingTool;
