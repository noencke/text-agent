import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
// Dark-friendly code highlighting theme (atom-one-dark)
import 'highlight.js/styles/atom-one-dark.css';
import './styles/global.css';
// Schema types are used only in the initial document builder now.
import ChatPane from './components/ChatPane';
import { Tree } from '@fluidframework/tree';
import { useState, useEffect } from 'react';
import { createInitialView } from './initialDocument.js';

export function App() {
  const [view] = useState(createInitialView);
  const [, forceRerender] = useState(0);
  Tree.on(view.root, 'treeChanged', () => forceRerender(i => i + 1));

  const [workingBranch, setWorkingBranch] = useState(view.fork());
  const [isDiffActive, setIsDiffActive] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mark that the working branch diverged from the base view.
  useEffect(() => workingBranch.events.on('changed', () => setHasChanges(true)), [workingBranch]);
  useEffect(() => { if (!hasChanges) setIsDiffActive(false); }, [hasChanges]);

  const resetBranch = () => {
    workingBranch.dispose();
    setWorkingBranch(view.fork());
    setHasChanges(false);
    setIsDiffActive(false);
  };

  const acceptChanges = () => {
    view.merge(workingBranch);
    setWorkingBranch(view.fork());
    setHasChanges(false);
    setIsDiffActive(false);
  };

  const previewRoot = isDiffActive ? view.root : workingBranch.root;

  const activateDiff = () => hasChanges && setIsDiffActive(true);
  const deactivateDiff = () => setIsDiffActive(false);

  return (
    <div className="markdown-app">
      <header className="app-header"><h1>SharedTree Agentic Text Editing</h1></header>
      <div className="panes">
        <section className="pane editor-pane" aria-label="Editor & chat">
          <ChatPane view={workingBranch} />
          <div className="chat-action-bar" aria-label="Tree actions">
            <button type="button" className="chat-action-btn chat-cancel-btn" onClick={resetBranch}>Reset</button>
            <button
              type="button"
              className="chat-action-btn chat-diff-btn"
              disabled={!hasChanges}
              aria-disabled={!hasChanges}
              onPointerDown={activateDiff}
              onPointerUp={deactivateDiff}
              onPointerLeave={deactivateDiff}
              onPointerCancel={deactivateDiff}
              onBlur={deactivateDiff}
            >
              Show Original
            </button>
            <button
              type="button"
              className="chat-action-btn chat-accept-btn"
              disabled={!hasChanges}
              aria-disabled={!hasChanges}
              onClick={acceptChanges}
            >
              Accept
            </button>
          </div>
        </section>
        <section className="pane preview-pane" aria-label="Preview">
          <div className="preview-inner">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                img: (props) => {
                  // Add lazy loading and error fallback styling.
                  return (
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
                    />
                  );
                },
              }}
            >
              {previewRoot.toMarkdown()}
            </ReactMarkdown>
          </div>
        </section>
      </div>
    </div>
  );
}
