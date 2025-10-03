import { useState, useEffect, FormEvent, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
// Use same dark-friendly highlight theme as preview
import 'highlight.js/styles/atom-one-dark.css';
import { createSemanticAgent } from '@fluidframework/tree-agent/alpha';
import { ChatOpenAI } from '@langchain/openai';
import { Root } from '../mdastSchema';
import { TreeViewAlpha } from 'fluid-framework/alpha';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Captured code snippet extracted by the validator for explanation.
let code: string | undefined;

function createAgent(view: TreeViewAlpha<typeof Root>) {
  // Access Vite env var without casting to any; Build-time replaced.
  const apiKey: string = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_OPENAI_API_KEY || '';
  return createSemanticAgent(
    new ChatOpenAI({
      model: 'gpt-4o',
      apiKey,
      maxTokens: 8000,
    }),
    view,
    {
      domainHints: 'MDAST document.',
      treeToString: p => p.toMarkdown(),
      validator: content => {
        const lines = content.split('\n');
        if (lines.length > 2) {
          lines.shift();
          lines.pop();
          code = lines.join('\n');
        }
        return true;
      },
      log: () => {},
    }
  );
}

export function ChatPane({ view }: { view: TreeViewAlpha<typeof Root> }) {
  const agent = useMemo(() => createAgent(view), [view]);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: uid(),
    role: 'ai',
    content: 'Hi! How can I help you with this document today?',
  }]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  useEffect(() => {
    // Reset conversation when the underlying view (branch) changes.
    setMessages([{ id: uid(), role: 'ai', content: 'Hi! How can I help you with this document today?' }]);
    setInput('');
    setIsResponding(false);
  }, [view]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isResponding) return;

    const userMessage: ChatMessage = {
      id: uid(),
      role: 'user',
      content: trimmed,
    };
    setMessages((m) => [...m, userMessage]);
    setInput('');
    setIsResponding(true);
    agent.query(trimmed)
      .then(resp => {
        let content = resp ?? '[No response]';
        if (code) {
          content += `\nDetails:\n\`\`\`javascript\n${code}\n\`\`\``;
          code = undefined;
        }
        setMessages(m => [...m, { id: uid(), role: 'ai', content }]);
      })
      .catch(err => setMessages(m => [...m, { id: uid(), role: 'ai', content: 'Error: ' + err.message }]))
      .finally(() => setIsResponding(false));
  }

  return (
  <div className="chat-pane-root">
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-busy={isResponding}
      >
        {messages.map((m) => (
          <div key={m.id} className={`chat-message chat-message-${m.role}`}>
            <div className="chat-bubble" data-role={m.role}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  img: (props) => (
                    <img
                      {...props}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.dataset.error = 'true';
                        if (!e.currentTarget.alt) {
                          e.currentTarget.alt = 'Image failed to load';
                        }
                      }}
                      style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '.5rem 0' }}
                    />
                  ),
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isResponding && (
          <div className="chat-message chat-message-ai">
            <div className="chat-bubble" data-role="ai">
              <span className="typing-dots" aria-label="AI is typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
      </div>
      <form className="chat-input-bar" onSubmit={submit}>
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isResponding}
          aria-label="Chat message"
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim() || isResponding}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatPane;
