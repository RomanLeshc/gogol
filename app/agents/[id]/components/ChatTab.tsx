import { ModelApp } from '@/lib/types';
import { ChatWidget } from '@/components/ChatWidget';

interface ChatTabProps {
  agentId: string;
  app: ModelApp;
}

export function ChatTab({ agentId, app }: ChatTabProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Chat Preview
      </h2>
      <div className="h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <ChatWidget agentId={agentId} app={app} />
      </div>
    </div>
  );
}

