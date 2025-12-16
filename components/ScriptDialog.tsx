import React, { useState, useRef, useEffect } from 'react';
import { AppSettings } from '../types';
import { callLLM } from '../services/geminiService';

interface ScriptDialogProps {
  onScriptConfirmed: (script: string) => void;
  appSettings: AppSettings;
  lang: 'en' | 'zh';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ScriptDialog: React.FC<ScriptDialogProps> = ({ onScriptConfirmed, appSettings, lang }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: lang === 'zh' 
        ? '你好！我是你的创意助手。请告诉我你想要创作的故事或场景，我会帮你完善创意文案。'
        : 'Hello! I\'m your creative assistant. Tell me the story or scene you want to create, and I\'ll help you refine your creative script.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [finalScript, setFinalScript] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setFinalScript(input); // 保存用户最后输入的内容

    try {
      const llmConfig = appSettings.llm;
      const apiKey = llmConfig.apiKey || process.env.API_KEY || '';

      if (!apiKey) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: lang === 'zh' ? '错误：未找到API密钥' : 'Error: API key not found'
        }]);
        setIsLoading(false);
        return;
      }

      const response = await callLLM(
        messages.map(m => ({ role: m.role, content: m.content })).concat([userMessage]),
        apiKey,
        1,
        llmConfig
      );

      const assistantMessage = response.choices[0]?.message?.content || 
        (lang === 'zh' ? '无法生成回复' : 'Unable to generate response');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage
      }]);
    } catch (error) {
      console.error('Dialog error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'zh' ? '出错了，请重试' : 'An error occurred, please try again'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmScript = () => {
    // 使用最后一条用户消息作为脚本
    if (finalScript) {
      onScriptConfirmed(finalScript);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border-2 border-gray-200">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={lang === 'zh' ? '输入你的想法...' : 'Type your idea...'}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 disabled:bg-gray-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {lang === 'zh' ? '发送' : 'Send'}
          </button>
        </div>

        <button
          onClick={handleConfirmScript}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          {lang === 'zh' ? '✓ 确认脚本，生成分镜' : '✓ Confirm Script & Generate Storyboard'}
        </button>
      </div>
    </div>
  );
};

export default ScriptDialog;
