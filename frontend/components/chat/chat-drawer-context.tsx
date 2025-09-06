'use client';
import { usePathname } from 'next/navigation';
import { ChatDrawer } from '@/components/chat/chat-drawer';

export function ChatDrawerWithContext() {
  const pathname = usePathname();
  const match = pathname.match(/^\/patients\/([^/]+)/);
  const patientNbr = match ? match[1] : undefined;

  return <ChatDrawer patientNbr={patientNbr} />;
}
