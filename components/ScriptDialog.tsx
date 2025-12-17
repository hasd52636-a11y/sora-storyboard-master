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
  const [hasUserMessage, setHasUserMessage] = useState(false);
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

      // 如果是第一条用户消息，附带系统指令
      const systemPrompt = lang === 'zh' 
        ? `你是一位享誉全球的叙事大师、视觉哲学家和顶尖电影导演。你的任务是：深入分析用户提供的原始想法/脚本/对话，将其重新构思为一个富有张力、视觉效果极强、且具备清晰情绪节奏的电影剧本大纲和分镜草稿。

【创作要求 - 视觉化叙事核心】
1. 场景与情绪定调：
   • 环境描述：创作一个具体且富有氛围感的场景描述（时间、地点、天气、主要光源）
   • 视觉主题：提炼出核心冲突和视觉语言
   • 色彩与纹理：确定电影调色风格和画风质感

2. 叙事节奏与分镜草案：
   • 将内容拆解为3-12个富有戏剧性的分镜草案
   • 核心结构：SET UP (铺垫) → BUILD (酝酿) → TURN (转折) → PAYOFF (高潮/收尾)
   • 镜头意图：每个分镜必须描述动作/对话、镜头类型/取景、和摄影机运动的目的

3. 输出风格：
   • 避免技术性的AI提示词格式
   • 以专业的剧本和导演笔记风格输出
   • 重点突出镜头语言的创造性和叙事的张力

用户输入：${input}`
        : `You are a world-renowned narrative master, visual philosopher, and top film director. Your task is to deeply analyze the raw ideas/scripts/dialogues provided by the user and reconceptualize them into a cinematic script outline and storyboard draft with strong visual impact and clear emotional rhythm.

【Creative Requirements - Visual Narrative Core】
1. Scene and Tone Setting:
   • Environment Description: Create a specific and atmospheric scene description (time, location, weather, main light source)
   • Visual Thesis: Extract the core conflict and visual language
   • Color and Texture: Determine the film color grading style and visual texture

2. Narrative Rhythm and Storyboard Draft:
   • Break down the content into 3-12 dramatic storyboard drafts
   • Core Structure: SET UP → BUILD → TURN → PAYOFF
   • Shot Intent: Each storyboard must describe action/dialogue, shot type/framing, and camera movement purpose

3. Output Style:
   • Avoid technical AI prompt format
   • Output in professional script and director's notes style
   • Emphasize the creativity of shot language and narrative tension

User Input: ${input}`;

      const messagesForLLM = !hasUserMessage
        ? [{ role: 'user', content: systemPrompt }]
        : messages.map((m: Message) => ({ role: m.role, content: m.content })).concat([userMessage]);
      
      setHasUserMessage(true);

      const response = await callLLM(
        messagesForLLM,
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
