// src/components/layouts/ChatPanel.tsx
import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { genaiApi } from '@/api/api';
import { toast } from 'sonner';
import { ChevronRight, Send, Bot, User, Copy, ExternalLink, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    id: string;
    title: string;
    score?: number;
    snippet?: string;
  }>;
}

export default function ChatPanel({ isOpen, onToggle }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const queryMutation = useMutation({
    mutationFn: async (query: string) => {
      return await genaiApi.queryRAG({
        query,
        type: 'USER', // For now, only implementing user queries
        topK: 5,
      });
    },
    onSuccess: (data, query) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        content: data.data.answer,
        timestamp: new Date(),
        sources: data.data.sources,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error: any) => {
      console.error('Chat query error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error(error?.response?.data?.message || 'Failed to get response');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || queryMutation.isPending) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Send query
    queryMutation.mutate(inputValue.trim());
    
    // Clear input
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
              <span className="font-medium text-slate-900">AI Assistant</span>
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

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4 h-10" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-900 mb-2">Ask me anything!</h3>
                  <p className="text-sm text-slate-500">
                    I can help you search through your documents and answer questions about them.
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.type === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.type === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-slate-600" />
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[80%] space-y-2",
                    message.type === 'user' ? "items-end" : "items-start"
                  )}>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        message.type === 'user'
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.type === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 mt-2 hover:bg-slate-200"
                          onClick={() => copyToClipboard(message.content)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-600">Sources:</p>
                        <div className="space-y-1">
                          {message.sources.map((source, index) => (
                            <div
                              key={source.id}
                              className="bg-slate-50 rounded-md p-2 text-xs border"
                            >
                              <div className="flex items-start gap-2">
                                <FileText className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-700 truncate">
                                    {source.title}
                                  </p>
                                  {source.snippet && (
                                    <p className="text-slate-600 mt-1 line-clamp-2">
                                      {source.snippet}
                                    </p>
                                  )}
                                  {source.score && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      Score: {(source.score * 100).toFixed(1)}%
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-500">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  
                  {message.type === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Loading indicator */}
              {queryMutation.isPending && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-slate-600" />
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-slate-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-200">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your documents..."
                className="flex-1"
                disabled={queryMutation.isPending}
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={!inputValue.trim() || queryMutation.isPending}
              >
                {queryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}