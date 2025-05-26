'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Для поддержки таблиц, сносок и т.д.
import rehypeRaw from 'rehype-raw'; // Для рендеринга HTML внутри Markdown (используйте с осторожностью)
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function AIAssistant() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.message || data.error || 'Произошла ошибка при получении ответа.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Произошла ошибка при отправке запроса к ИИ ассистенту.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">ИИ Ассистент</h1>

          {/* Чат */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-[600px] flex flex-col">
              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          code(props: any) {
                            const {node, className, children, ...rest} = props;
                            const isInline = props.inline;
                            const match = /language-(\w+)/.exec(className || '');
                            return !isInline && match ? (
                              <SyntaxHighlighter
                                style={okaidia as any}
                                language={match[1]}
                                PreTag="div"
                                {...rest}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...rest}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Форма ввода */}
              <form onSubmit={handleSubmit} className="border-t p-4">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Введите ваш вопрос..."
                    className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Отправить
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Подсказки */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Примеры вопросов
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setInput('Объясни, как работает алгоритм сортировки пузырьком')}
                className="text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                Объясни, как работает алгоритм сортировки пузырьком
              </button>
              <button
                onClick={() => setInput('Помоги оптимизировать этот код')}
                className="text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                Помоги оптимизировать этот код
              </button>
              <button
                onClick={() => setInput('Как работает бинарное дерево поиска?')}
                className="text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                Как работает бинарное дерево поиска?
              </button>
              <button
                onClick={() => setInput('Объясни концепцию рекурсии')}
                className="text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                Объясни концепцию рекурсии
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 