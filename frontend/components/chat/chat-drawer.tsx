'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { sendChatMessage, sendPatientChatMessage } from '@/lib/api';
import { ChatResponse } from '@/lib/types';

interface UsedDataShape {
  risk_prob_before?: number;
  risk_prob_after?: number;
  drivers?: string[]; // ensure array
  [k: string]: any;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  usedData?: UsedDataShape;
  links?: string[];
}

interface ChatDrawerProps {
  patientNbr?: string;
}

export function ChatDrawer({ patientNbr }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const chatMutation = useMutation({
    mutationFn: async ({ message, scope }: { message: string; scope: 'global' | 'patient' }) => {
      if (scope === 'patient') {
        if (!patientNbr) throw new Error('patientNbr required for patient-scoped chat');
        return await sendPatientChatMessage(patientNbr, message);
      }
      return await sendChatMessage(message);
    },
    onSuccess: (data, variables) => {
      // DEBUG: log response so we can see shapes during dev
      // console.log('chat response', data);

      // Normalize content: prefer data.answer, else try patient insights summary
      const content =
        (data && (data.answer ?? data?.insights?.summary ?? data?.patient?.insights?.summary)) || 'No reply';

      // Normalize usedData into a predictable shape (avoid undefined)
      const usedDataRaw = data?.used_data ?? data?.insights?.used_data ?? data?.patient?.used_data ?? data?.patient?.risk ?? {};
      const usedData: UsedDataShape = {
        risk_prob_before: usedDataRaw?.risk_prob_before ?? usedDataRaw?.risk_prob ?? undefined,
        risk_prob_after: usedDataRaw?.risk_prob_after ?? undefined,
        drivers: Array.isArray(usedDataRaw?.drivers) ? usedDataRaw.drivers : [],
        // copy other keys if present
        ...usedDataRaw,
      };

      const links = Array.isArray(data?.links)
        ? data.links
        : Array.isArray(data?.insights?.links)
        ? data.insights.links
        : [];

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content,
        timestamp: new Date(),
        usedData,
        links,
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (err) => {
      // surface a small assistant message on error
      const assistantMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        type: 'assistant',
        content: `Error: ${String((err as Error).message ?? 'unknown')}`,
        timestamp: new Date(),
        usedData: { drivers: [] },
        links: [],
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
  });

  const handleSend = (message: string, scope: 'global' | 'patient') => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    chatMutation.mutate({ message, scope });
  };

  const quickPrompts = {
    global: [
      'Show top 10 high-risk patients',
      'What are the main cohort risk drivers?',
      'Export current patient list as CSV',
    ],
    patient: [
      'Why is this patient high risk?',
      'What if A1C was normal?',
      'Suggest intervention strategies',
    ],
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-96 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Clinical Assistant</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="global" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="patient" disabled={!patientNbr}>
              Patient
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</div>
              {quickPrompts.global.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleSend(prompt, 'global')}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patient" className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</div>
              {quickPrompts.patient.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleSend(prompt, 'patient')}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Chat Messages */}
        <div className="flex-1 mt-4 space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <Card className={message.type === 'user' ? 'ml-4' : 'mr-4'}>
                <CardContent className="p-3">
                  <div className="text-sm">{message.content}</div>
                  
                  {message.usedData && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 space-y-1">
                        {typeof message.usedData.risk_prob_before === 'number' && (
                          <div>Before: {Math.round(message.usedData.risk_prob_before * 100)}%</div>
                        )}
                        {typeof message.usedData.risk_prob_after === 'number' && (
                          <div>After: {Math.round(message.usedData.risk_prob_after * 100)}%</div>
                        )}
                        {Array.isArray(message.usedData.drivers) && message.usedData.drivers.length > 0 && (
                          <div>Drivers: {message.usedData.drivers.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {message.links && message.links.length > 0 && (
                    <div className="mt-2">
                      {message.links.map((link, index) => (
                        <Button
                          key={index}
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-blue-600"
                          asChild
                        >
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            View Details →
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
          
          {chatMutation.isPending && (
            <Card className="mr-4">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Input */}
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Ask about patients or risk factors..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input, patientNbr ? 'patient' : 'global');
              }
            }}
          />
          <Button
            size="icon"
            onClick={() => handleSend(input, patientNbr ? 'patient' : 'global')}
            disabled={!input.trim() || chatMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}