import React, { useRef, useEffect, useState } from 'react';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type PersonaOption = {
  value: string;
  label: string;
  description?: string;
  hint?: string;
};

interface UIOverlayProps {
  isLoading: boolean;
  messages: ChatMessage[];
  onPromptSubmit: (prompt: string, persona: string) => void;
  personaOptions?: PersonaOption[];
  activePersona?: string;
  onPersonaChange?: (persona: string) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  isLoading,
  messages,
  onPromptSubmit,
  personaOptions = [
    { value: 'cosmic', label: 'Cosmic Muse', hint: 'Drift through starlit metaphors.' },
    { value: 'analyst', label: 'Pattern Analyst', hint: 'Seek structure and clarity.' },
    { value: 'dream', label: 'Lucid Dreamer', hint: 'Soft surreal imagery, pastel light.' },
  ],
  activePersona,
  onPersonaChange,
}) => {
  const [persona, setPersona] = useState<string>(
    activePersona ?? personaOptions[0]?.value ?? 'cosmic',
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activePersona && activePersona !== persona) {
      setPersona(activePersona);
    }
  }, [activePersona, persona]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePersonaChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPersona = event.target.value;
    setPersona(nextPersona);
    onPersonaChange?.(nextPersona);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = inputRef.current?.value.trim();
    if (!prompt || isLoading) {
      return;
    }
    onPromptSubmit(prompt, persona);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const activeOption = personaOptions.find((option) => option.value === persona);
  const placeholder = isLoading
    ? 'Generating...'
    : activeOption?.hint ?? 'Describe what you want to see.';

  return (
    <div className="pointer-events-auto absolute bottom-6 left-6 w-80 max-h-[80vh] flex flex-col rounded-2xl border border-cyan-400/25 bg-black/75 backdrop-blur-lg shadow-[0_0_40px_rgba(0,255,255,0.25)]">
      <div className="px-4 pt-4 pb-3 border-b border-cyan-400/10">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Consciousness Chat
          </span>
          <select
            value={persona}
            onChange={handlePersonaChange}
            className="text-xs bg-black/70 border border-cyan-400/40 text-cyan-100 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
          >
            {personaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeOption?.description && (
        <div className="px-4 pt-2 text-[10px] uppercase tracking-[0.22em] text-cyan-200/60">
          {activeOption.description}
        </div>
      )}

      <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-xs">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-xl border px-3 py-2 leading-relaxed shadow-sm ${
              message.role === 'user'
                ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-100'
                : 'bg-slate-900/80 border-cyan-300/20 text-slate-100'
            }`}
          >
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/70">
              {message.role === 'user' ? 'You' : 'Nebula'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="rounded-xl border border-cyan-300/30 bg-slate-900/70 px-3 py-2 text-xs leading-relaxed text-cyan-100 animate-pulse">
            Synthesizing a response…
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-cyan-400/10 bg-black/80 px-4 pb-4 pt-3"
      >
        <div className="relative rounded-xl border border-cyan-400/30 bg-black/60">
          <textarea
            ref={inputRef}
            rows={3}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full resize-none rounded-xl bg-transparent px-3 py-3 pr-16 text-sm text-cyan-50 placeholder:text-cyan-200/40 focus:outline-none"
            aria-label="Describe what to create"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute bottom-2 right-2 rounded-lg bg-cyan-400/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:bg-cyan-500/40"
          >
            {isLoading ? 'Synthesizing' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UIOverlay;
