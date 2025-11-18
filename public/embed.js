/**
 * Gogol AI Agent Embed Script
 * 
 * Usage:
 * <script src="https://your-domain.com/embed.js" data-agent-id="YOUR_AGENT_ID" data-api-base="https://api.ethoradev.com/v1"></script>
 * 
 * Or via npm:
 * import { initEthoraWidget } from '@ethora/ai-widget';
 * initEthoraWidget({ agentId: 'YOUR_AGENT_ID', apiBase: 'https://api.ethoradev.com/v1' });
 */

(function() {
  'use strict';

  // Configuration from script tag attributes
  const scriptTag = document.currentScript || document.querySelector('script[data-agent-id]');
  const agentId = scriptTag?.getAttribute('data-agent-id');
  const apiBase = scriptTag?.getAttribute('data-api-base') || 'https://api.ethoradev.com/v1';
  const embedKey = scriptTag?.getAttribute('data-embed-key') || '';
  const position = scriptTag?.getAttribute('data-position') || 'bottom-right';
  const theme = scriptTag?.getAttribute('data-theme') || 'light';

  if (!agentId) {
    console.error('Gogol Widget: agent-id is required');
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'ethora-widget-container';
  widgetContainer.style.cssText = `
    position: fixed;
    ${position.includes('right') ? 'right: 24px;' : 'left: 24px;'}
    ${position.includes('bottom') ? 'bottom: 24px;' : 'top: 24px;'}
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  `;
  document.body.appendChild(widgetContainer);

  // Widget state
  let isOpen = false;
  let messages = [];
  let appConfig = null;

  // Load agent config
  async function loadAgentConfig() {
    try {
      const response = await fetch(`${apiBase}/apps/${agentId}`, {
        headers: {
          'Authorization': embedKey ? `Bearer ${embedKey}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to load agent config');
      const data = await response.json();
      appConfig = data.result;
      return appConfig;
    } catch (error) {
      console.error('Failed to load agent config:', error);
      return null;
    }
  }

  // Create widget UI
  function createWidget() {
    const button = document.createElement('button');
    button.id = 'ethora-widget-button';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    button.style.cssText = `
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${appConfig?.primaryColor || '#0052CD'};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    `;
    button.addEventListener('click', toggleWidget);
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

    const chatWindow = document.createElement('div');
    chatWindow.id = 'ethora-widget-chat';
    chatWindow.style.cssText = `
      position: absolute;
      ${position.includes('right') ? 'right: 0;' : 'left: 0;'}
      ${position.includes('bottom') ? 'bottom: 72px;' : 'top: 72px;'}
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        ${appConfig?.logoImage ? `<img src="${appConfig.logoImage}" style="width: 32px; height: 32px; border-radius: 50%;" />` : ''}
        <div>
          <div style="font-weight: 600; font-size: 14px;">${appConfig?.displayName || 'AI Assistant'}</div>
          <div style="font-size: 12px; color: #6b7280;">Online</div>
        </div>
      </div>
      <button id="ethora-widget-close" style="background: none; border: none; cursor: pointer; padding: 4px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    chatWindow.appendChild(header);

    // Messages area
    const messagesArea = document.createElement('div');
    messagesArea.id = 'ethora-widget-messages';
    messagesArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    chatWindow.appendChild(messagesArea);

    // Input area
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    `;
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type your message...';
    input.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    `;
    const sendButton = document.createElement('button');
    sendButton.textContent = 'Send';
    sendButton.style.cssText = `
      padding: 8px 16px;
      background: ${appConfig?.primaryColor || '#0052CD'};
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    `;
    
    sendButton.addEventListener('click', () => {
      const message = input.value.trim();
      if (message) {
        sendMessage(message);
        input.value = '';
      }
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendButton.click();
      }
    });

    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);
    chatWindow.appendChild(inputArea);

    // Close button handler
    document.getElementById('ethora-widget-close')?.addEventListener('click', toggleWidget);

    widgetContainer.appendChild(button);
    widgetContainer.appendChild(chatWindow);
  }

  function toggleWidget() {
    isOpen = !isOpen;
    const chatWindow = document.getElementById('ethora-widget-chat');
    if (chatWindow) {
      chatWindow.style.display = isOpen ? 'flex' : 'none';
    }
  }

  function addMessage(role, content) {
    messages.push({ role, content, timestamp: new Date() });
    renderMessages();
  }

  function renderMessages() {
    const messagesArea = document.getElementById('ethora-widget-messages');
    if (!messagesArea) return;

    messagesArea.innerHTML = messages.map(msg => {
      const isUser = msg.role === 'user';
      return `
        <div style="display: flex; justify-content: ${isUser ? 'flex-end' : 'flex-start'};">
          <div style="
            max-width: 80%;
            padding: 8px 12px;
            border-radius: 8px;
            background: ${isUser ? (appConfig?.primaryColor || '#0052CD') : '#f3f4f6'};
            color: ${isUser ? 'white' : '#111827'};
            font-size: 14px;
          ">
            ${content}
          </div>
        </div>
      `;
    }).join('');
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  async function sendMessage(message) {
    addMessage('user', message);
    
    // Simulate API call (replace with actual endpoint)
    try {
      // In production, call: POST ${apiBase}/chat/${agentId}
      await new Promise(resolve => setTimeout(resolve, 1000));
      addMessage('assistant', `I received: "${message}". This is a simulated response.`);
    } catch (error) {
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
  }

  // Initialize widget
  loadAgentConfig().then(() => {
    createWidget();
    if (appConfig?.aiBot?.greetingMessage) {
      addMessage('assistant', appConfig.aiBot.greetingMessage);
    }
  });
})();

