import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWidget } from '@/components/ChatWidget';
import { ModelApp } from '@/lib/types';

const mockApp: ModelApp = {
  _id: 'test-app-id',
  displayName: 'Test Agent',
  appTagline: 'Test tagline',
  logoImage: '',
  aiBot: {
    userId: 'user-id',
    chatId: 'chat-id',
    status: 'on',
    greetingMessage: 'Hello! How can I help you?',
    isRAG: true,
    trigger: '',
    prompt: '',
    siteLinks: [],
    siteUrlsV2: [],
    user: {
      _id: 'user-id',
      firstName: 'Test',
      lastName: 'User',
      isBot: false,
    },
    chat: {
      _id: 'chat-id',
      name: 'test-chat',
      title: 'Test Chat',
      description: '',
      type: '',
      picture: '',
    },
  },
  appToken: '',
  bundleId: '',
  coinName: '',
  coinSymbol: '',
  createdAt: new Date().toISOString(),
  creatorId: '',
  defaultAccessAssetsOpen: false,
  defaultAccessProfileOpen: false,
  defaultRooms: [],
  domainName: '',
  isAllowedNewAppCreate: false,
  isBaseApp: false,
  parentAppId: '',
  primaryColor: '#0052CD',
  signonOptions: [],
  sublogoImage: '',
  firebaseWebConfigString: '',
  stats: {
    recentlyApiCalls: 0,
    recentlyFiles: 0,
    recentlyIssuance: 0,
    recentlyRegistered: 0,
    recentlySessions: 0,
    recentlyTokens: 0,
    recentlyTransactions: 0,
    totalApiCalls: 0,
    totalFiles: 0,
    totalIssuance: 0,
    totalRegistered: 0,
    totalSessions: 0,
    totalTransactions: 0,
    totalChats: 0,
    totalTokens: 0,
    recentlyChats: 0,
  },
  systemChatAccount: {
    jid: '',
  },
  updatedAt: new Date().toISOString(),
  usersCanFree: false,
  afterLoginPage: '',
  availableMenuItems: {
    chats: true,
    profile: true,
    settings: true,
  },
  googleServicesJson: '',
  googleServiceInfoPlist: '',
  appSecret: '',
  allowUsersToCreateRooms: false,
};

describe('ChatWidget', () => {
  it('renders chat widget with greeting message', async () => {
    render(<ChatWidget agentId="test-id" app={mockApp} />);

    await waitFor(() => {
      expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
    });
  });

  it('displays agent name in header', () => {
    render(<ChatWidget agentId="test-id" app={mockApp} />);

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('allows sending messages', async () => {
    render(<ChatWidget agentId="test-id" app={mockApp} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByText(/send/i);

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('sends message on Enter key press', async () => {
    render(<ChatWidget agentId="test-id" app={mockApp} />);

    const input = screen.getByPlaceholderText(/type your message/i);

    fireEvent.change(input, { target: { value: 'Enter test' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText('Enter test')).toBeInTheDocument();
    });
  });

  it('shows loading state when sending message', async () => {
    render(<ChatWidget agentId="test-id" app={mockApp} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByText(/send/i);

    fireEvent.change(input, { target: { value: 'Loading test' } });
    fireEvent.click(sendButton);

    // Should show loading indicator
    await waitFor(() => {
      expect(sendButton).toBeDisabled();
    });
  });
});

