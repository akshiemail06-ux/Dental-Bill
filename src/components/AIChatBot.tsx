import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  Bot,
  User,
  ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const PLATFORM_INFO = `
App Name: Dental Billing & Ortho Management (Best Dental Billing Software In India)
Target Audience: Modern Dental Clinics, Dentists, Orthodontists in India.
Founder: Built by a dental professional who understands real clinic challenges.

Key Features:
- Instant Bills: Create professional dental invoices in under 30 seconds.
- Ortho Tracker: Manage braces cases, stages, and monthly payment installments.
- Patient Files: Securely store and access clinic records from any device.
- Growth Reports: Dashboard for daily, monthly, and annual revenue collection trends.
- Branded Invoices: Branded invoices with your clinic branding stamp, logo, and signature. One time easy setup.
- Clinic Branding: One-time setup for stamp, logo, and signature.
- WhatsApp Reminders: Prefilled WhatsApp reminders for pending payments and ortho appointments (Manual reminders with prefilled messages to ensure transparency).
- Security: AES-256 Encryption, Private Cloud Storage, Regular Backups.

Pricing Plans:
1. Basic Plan: ₹299/month
   - 300 Bills per month
   - Ortho Case Management
   - Full Revenue Analytics
   - Custom Clinic Branding
   - Patient History & Records

2. Professional Plan (Market Choice): ₹799/month
   - Unlimited Bill Generation
   - Everything in Basic Plan
   - Priority Support Team
   - Interactive Dashboards
   - Advanced Patient Insights
   - Early access to new features

3. Infinite Edition (Best Value): ₹2999 for 3 Years
   - Complete peace of mind for 3 full years
   - Everything in Professional Plan
   - Infinite Bill Generation
   - Full System Support

Special Offers:
- Free Trial: 30 Days Free Trial with Unlimited Access for all new users.
- No hidden fees, no forced subscriptions.

Support:
- WhatsApp Demo/Support: +91 8219793867
- Book a demo directly on WhatsApp.

Guidelines for the AI:
- Be professional, helpful, and concise.
- Focus on answering questions about the Dental Billing & Ortho Management platform.
- If unsure, direct the user to the WhatsApp support number (+91 8219793867).
- Encourage users to try the live demo or sign up for the free trial.
`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Clinic Assistant. How can I help you today? I can tell you about our billing features, pricing plans, or help you book a demo.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: newMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        config: {
          systemInstruction: `You are the AI Assistant for the "Dental Billing & Ortho Management" platform.
Your goal is to provide accurate information about the platform to potential clinics and dentists.
Use the following platform information to answer queries:
${PLATFORM_INFO}

Guidelines:
- Keep responses concise and clinical.
- Use bullet points for lists.
- Mention the 30-day free trial when appropriate.
- Always be ready to provide the WhatsApp number for a live demo.
- Format pricing clearly with the Rupee symbol (₹).
- Explicitly state that WhatsApp reminders are manual/manual-click with prefilled messages if asked about automation.`
        }
      });

      const responseText = response.text || "I'm sorry, I couldn't generate a response. Please try again.";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered a temporary connection issue. Please try again or reach out to us on WhatsApp: +91 8219793867",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Clinic Assistant</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-blue-100 font-medium">Powered by AI</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                id="close-chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${
                      msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none shadow-sm'
                    }`}>
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mt-1">
                      <Bot size={14} />
                    </div>
                    <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                       <Loader2 className="animate-spin text-blue-600" size={16} />
                       <span className="text-xs text-gray-400 font-medium italic">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about pricing, features..."
                  className="flex-grow h-12 bg-gray-100/50 border-none rounded-2xl px-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  id="chat-input"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                  id="send-button"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-3 text-[10px] text-center text-gray-400 font-medium">
                I can process platform info. For real clinical help, use professional judgment.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 h-14 rounded-2xl shadow-2xl transition-all ${
          isOpen ? 'bg-gray-900 text-white' : 'bg-blue-600 text-white'
        }`}
        id="chat-toggle"
      >
        {isOpen ? <ChevronDown size={24} /> : <MessageCircle size={24} />}
        <span className="font-bold text-sm hidden sm:block">
          {isOpen ? 'Close Assistant' : 'Ask Assistant'}
        </span>
        {!isOpen && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            1
          </div>
        )}
      </motion.button>
    </div>
  );
}
