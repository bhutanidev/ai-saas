// src/components/layouts/ChatPanel.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatPanel({ isOpen, onToggle }: ChatPanelProps) {
  return (
    <div
      className={cn(
        "bg-white border-l border-slate-200 flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "w-80" : "w-0"
      )}
    >
      {isOpen && (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-slate-600" />
              <span className="font-medium text-slate-900">Chatbot</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-1 h-auto"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {/* Welcome Message */}
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Bot className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
                  <p className="text-slate-700">
                    Hello! I'm your AI assistant. I can help you search through your documents and answer questions about them. Upload some documents and start chatting!
                  </p>
                </div>
              </div>
              
              {/* Placeholder for future chat messages */}
              <div className="text-center text-sm text-slate-500 py-8">
                Chat messages will appear here
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about your documents..."
                className="flex-1"
                disabled
              />
              <Button size="sm" disabled>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Chat functionality coming soon
            </p>
          </div>
        </>
      )}
    </div>
  );
}