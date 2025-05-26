'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"; // Import shadcn/ui Dialog components
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Define interfaces for data
interface Task {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  sectionNumber: number | null;
  // Add other necessary fields, but exclude answer/solution
}

interface TaskResult {
  taskId: string;
  taskTitle: string;
  submittedAnswer: string;
  correctAnswer: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
}

// Placeholder components (will be replaced or detailed later)
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
    <div
      className="bg-blue-600 h-4 rounded-full"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

const TaskCard = ({ task, onSubmit }: { task: Task; onSubmit: (answer: string) => void }) => {
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [showTaskAIChat, setShowTaskAIChat] = useState(false);
  const [taskAIMessages, setTaskAIMessages] = useState<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
  }[]>([]);
  const [taskAIInput, setTaskAIInput] = useState('');
  const [isTaskAILoading, setIsTaskAILoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answer);
    setAnswer('');
  };

  const handleExplainSolution = async () => {
    setLoadingExplanation(true);
    setExplanation(null);
    try {
      const response = await fetch('/api/explain-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, taskDescription: task.description }),
      });
      const data = await response.json();
      if (response.ok) {
        setExplanation(data.explanation);
      } else {
        setExplanation(data.error || 'Не удалось получить объяснение.');
      }
    } catch (error) {
      console.error('Error fetching explanation:', error);
      setExplanation('Произошла ошибка при получении объяснения.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleTaskAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskAIInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: taskAIInput,
      role: 'user' as 'user' | 'assistant',
      timestamp: new Date(),
    };

    setTaskAIMessages((prev) => [...prev, userMessage]);
    setTaskAIInput('');
    setIsTaskAILoading(true);

    try {
      // Добавляем контекст задачи к сообщению пользователя
      const contextMessage = `Помоги решить задачу. Вот описание задачи:\n\n${task.description}\n\n${userMessage.content}`;

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: contextMessage }),
      });

      const data = await response.json();

      const assistantMessage = {
        id: Date.now().toString(),
        content: data.message || data.error || 'Произошла ошибка при получении ответа от ИИ.',
        role: 'assistant' as 'user' | 'assistant',
        timestamp: new Date(),
      };
      setTaskAIMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error fetching task AI response:', error);
      const errorMessage = {
        id: Date.now().toString(),
        content: 'Произошла ошибка при отправке запроса к ИИ ассистенту.',
        role: 'assistant' as 'user' | 'assistant',
        timestamp: new Date(),
      };
      setTaskAIMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTaskAILoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{task.title}</h2>
      <p className="text-gray-700 mb-4">{task.description}</p>
      <p className="text-sm text-gray-500 mb-4">Макс. баллов: {task.maxPoints}</p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-4"
          rows={4}
          placeholder="Введите ваш ответ"
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Отправить ответ
        </button>
        
        {/* Кнопка Открыть/Скрыть чат с ИИ */}
        <button
          type="button"
          onClick={() => setShowTaskAIChat(!showTaskAIChat)}
          className="ml-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
        >
          {showTaskAIChat ? 'Скрыть чат с ИИ' : 'Открыть чат с ИИ'}
        </button>
      </form>

      {/* Встроенный чат с ИИ */}
      {showTaskAIChat && (
        <div className="mt-6 border rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-100 font-semibold">
            Чат с ИИ Ассистентом по заданию: № {task.sectionNumber ? `${task.sectionNumber}.` : ''}{task.title}
          </div>
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-white">
            {taskAIMessages.map((message) => (
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
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={okaidia}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
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
             {isTaskAILoading && (
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
           <form onSubmit={handleTaskAISubmit} className="border-t p-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={taskAIInput}
                onChange={(e) => setTaskAIInput(e.target.value)}
                placeholder="Задайте вопрос по задаче..."
                className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isTaskAILoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Спросить
              </button>
            </div>
          </form>
        </div>
      )}

      {explanation && (
        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Объяснение:</h3>
          <p className="text-blue-900">{explanation}</p>
        </div>
      )}
    </div>
  );
};

export default function TaskSelectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [incorrectTasks, setIncorrectTasks] = useState<TaskResult[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth'); // Redirect to login if not authenticated
    }
  }, [session, status, router]);

  // Fetch task selection
  useEffect(() => {
    if (!session) return; // Only fetch if session is available

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tests/selection'); // We will create this API
        if (!response.ok) {
          throw new Error('Failed to fetch task selection');
        }
        const data = await response.json();
        setTasks(data.data); // Assuming the API returns { data: Task[] }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [session]); // Dependency on session to refetch if user status changes

  const handleTaskSubmit = async (answer: string) => {
    if (!tasks || tasks.length === 0) return;

    const currentTask = tasks[currentTaskIndex];
    if (!currentTask) return;

    try {
      // Submit the answer to an API endpoint
      const response = await fetch('/api/tests/selection/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: currentTask.id,
          answer: answer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit answer');
      }

      const resultData = await response.json();

      // Store the result for this task
      setResults((prevResults) => [
        ...prevResults,
        {
          taskId: currentTask.id,
          taskTitle: currentTask.title,
          submittedAnswer: answer,
          correctAnswer: resultData.correctAnswer,
          isCorrect: resultData.isCorrect,
          pointsAwarded: resultData.pointsAwarded,
        },
      ]);

      // Move to the next task or finish
      if (currentTaskIndex < tasks.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      } else {
        // All tasks completed
        // Calculate total score and incorrect tasks
        const finalTotalScore = results.reduce((sum, res) => sum + res.pointsAwarded, 0) + resultData.pointsAwarded; // Include score of the last task
        const finalIncorrectTasks = results.filter(res => !res.isCorrect);
         if (!resultData.isCorrect) { // Add the last task result if incorrect
           finalIncorrectTasks.push({
            taskId: currentTask.id,
            taskTitle: currentTask.title,
            submittedAnswer: answer,
            correctAnswer: resultData.correctAnswer,
            isCorrect: resultData.isCorrect,
            pointsAwarded: resultData.pointsAwarded,
           });
         }

        setTotalScore(finalTotalScore);
        setIncorrectTasks(finalIncorrectTasks);
        setShowResultsDialog(true);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
      console.error(err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Ошибка: {error}</div>;
  }

  const progress = tasks.length > 0 ? ((currentTaskIndex + 1) / tasks.length) * 100 : 0;
  const currentTask = tasks[currentTaskIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Подборка заданий</h1>

        {tasks.length > 0 ? (
          <>
            <ProgressBar progress={progress} />
            {currentTask ? (
              <TaskCard task={currentTask} onSubmit={handleTaskSubmit} />
            ) : (
              <div>Загрузка задания...</div>
            )}
          </>
        ) : (
          <div>Нет заданий в подборке.</div>
        )}

      </main>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Результаты подборки заданий</DialogTitle>
            <DialogDescription>
              Поздравляем! Вы завершили подборку заданий.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-lg font-semibold mb-4">Набрано баллов: {totalScore}</p>
            {incorrectTasks.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-2">Неправильно решенные задачи:</h4>
                <ul className="list-disc pl-5 space-y-4">
                  {incorrectTasks.map((res, index) => (
                    <li key={index} className="bg-gray-100 p-3 rounded-md">
                      <p className="font-semibold">Задача: {res.taskTitle}</p>
                      <p className="text-sm text-gray-700">Ваш ответ: {res.submittedAnswer}</p>
                      <p className="text-sm text-red-600">Правильный ответ: {res.correctAnswer || 'Не указан'}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button
                onClick={() => router.push('/profile')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Перейти в профиль
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 