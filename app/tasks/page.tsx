'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import './task-animations.css';
import type { SidebarItem } from '../components/Sidebar';

// Импорт компонентов Breadcrumb из shadcn/ui
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: 'Легкая' | 'Средняя' | 'Сложная';
  points: number;
  category: string;
  completed: boolean;
  sectionNumber: number | null;
  files?: { name: string; url: string }[];
  answer: string | null;
  solution: string | null;
  isCompleted: boolean;
  userScore?: number;
}

interface Section {
  id: string;
  title: string;
  tasks: Task[];
}

export default function Tasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State to hold tasks fetched from API
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [errorTasks, setErrorTasks] = useState<string | null>(null);

  // State for currently selected section and task (using IDs based on sectionNumber and task.id)
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  // State for user answer input and submission status
  const [userAnswer, setUserAnswer] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<{ message: string; score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch tasks from the API
  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await fetch('/api/tasks');
      if (!res.ok) {
        throw new Error(`Error fetching tasks: ${res.statusText}`);
      }
      const data = await res.json();
      setTasks(data.data);

      // After fetching, select the first section and task if available
      if (data.data.length > 0) {
        const groupedTasks = groupTasksBySection(data.data);
        const firstSectionId = Object.keys(groupedTasks).sort()[0];
        if (firstSectionId) {
          setSelectedSectionId(firstSectionId);
          const firstTask = groupedTasks[firstSectionId][0];
          if(firstTask) {
            setSelectedTaskId(firstTask.id);
          }
        }
      }

    } catch (err: any) {
      setErrorTasks(err.message || 'Произошла ошибка при загрузке задач.');
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []); // Empty dependency array means this runs once on mount

  // Reset user answer and submission status when selected task changes
  useEffect(() => {
    setUserAnswer('');
    setSubmissionStatus(null);
    setShowAnswer(false); // Hide solution when changing task
  }, [selectedTaskId]);

  // Helper to group tasks by sectionNumber
  const groupTasksBySection = (taskList: Task[]): { [key: string]: Task[] } => {
    const grouped: { [key: string]: Task[] } = {};
    taskList.forEach(task => {
      // Use a default section for tasks without sectionNumber, or handle as needed
      const sectionId = task.sectionNumber ? task.sectionNumber.toString() : 'Без раздела'; 
      if (!grouped[sectionId]) {
        grouped[sectionId] = [];
      }
      grouped[sectionId].push(task);
    });
    // Sort tasks within each section by ID or title if needed
    Object.keys(grouped).forEach(sectionId => {
      grouped[sectionId].sort((a, b) => a.title.localeCompare(b.title)); // Example sort
    });
    return grouped;
  };

  const groupedTasks = groupTasksBySection(tasks);
  const sectionIds = Object.keys(groupedTasks).sort((a, b) => {
    // Sort sections numerically if they are numbers, otherwise alphabetically
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Преобразуем сгруппированные задачи в SidebarItem[]
  const sidebarItems: SidebarItem[] = sectionIds.map((sectionId) => ({
    id: sectionId,
    title: sectionId === 'Без раздела' ? 'Без раздела' : `Раздел ${sectionId}`,
    type: 'section',
    children: groupedTasks[sectionId].map((task) => ({
      id: task.id,
      title: task.title,
      type: 'task',
    })),
  }));

  // Обработчик выбора пункта в sidebar
  const handleSidebarSelect = (id: string) => {
    // Check if it's a section ID
    if (groupedTasks[id]) {
      setSelectedSectionId(id);
      setSelectedTaskId(groupedTasks[id][0]?.id || '');
      // router.push(`/tasks?section=${id}`); // Optional: update URL
      return;
    }
    // Check if it's a task ID
    for (const secId of sectionIds) {
      const task = groupedTasks[secId].find((t) => t.id === id);
      if (task) {
        setSelectedSectionId(secId);
        setSelectedTaskId(task.id);
        // router.push(`/tasks?section=${secId}&task=${id}`); // Optional: update URL
        return;
      }
    }
  };

  // Determine the currently selected section and task objects
  const currentSectionTasks = groupedTasks[selectedSectionId] || [];
  const task = currentSectionTasks.find((t) => t.id === selectedTaskId);

  // Активный пункт для sidebar
  const activeSidebarId = selectedTaskId || selectedSectionId;

  // Handle answer submission
  const handleSubmitAnswer = async () => {
    if (!task || userAnswer.trim() === '' || submitting) return; // Prevent empty submissions or double submission

    setSubmitting(true);
    setSubmissionStatus(null); // Clear previous status

    try {
      const res = await fetch('/api/user-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          userAnswer: userAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle API errors (e.g., task not found, unauthorized)
        setSubmissionStatus({ message: data.error || 'Ошибка при отправке ответа', score: 0 });
        console.error('Submission error:', data);
      } else {
        // Handle successful submission (correct or incorrect answer)
        setSubmissionStatus({ message: data.message, score: data.score });
        
        // Update the specific task's completion status in the state
        setTasks(prevTasks => prevTasks.map(t => 
            t.id === task.id 
                ? { ...t, isCompleted: data.score > 0, userScore: data.score } 
                : t
        ));
      }

    } catch (err: any) {
      setSubmissionStatus({ message: err.message || 'Произошла ошибка сети', score: 0 });
      console.error('Network error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  if (status === 'loading' || loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (errorTasks) {
    return <div className="text-red-500 text-center mt-10">Ошибка загрузки задач: {errorTasks}</div>;
  }

  if (tasks.length === 0) {
    return <div className="text-gray-600 text-center mt-10">Нет доступных задач.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        sidebarItems={sidebarItems}
        onSidebarSelect={handleSidebarSelect}
        activeSidebarId={activeSidebarId}
      />
      <main className="flex container mx-auto px-4 py-8 gap-8">
        {/* Sidebar для десктопа - скрывается на мобильных */}
        <aside className="w-64 bg-white rounded-lg shadow p-4 h-fit sticky top-8 self-start hidden md:block transition-shadow duration-300 ease-in-out">
          <nav>
            <h2 className="text-lg font-bold mb-4">Разделы</h2>
            <ul className="space-y-2">
              {sectionIds.map((sectionId) => (
                <li key={sectionId}>
                  <button
                    className={`w-full text-left px-2 py-1 rounded hover:bg-blue-50 font-medium transition-colors duration-200 ease-in-out ${selectedSectionId === sectionId ? 'bg-blue-100 text-blue-800' : 'text-gray-900'}`}
                    onClick={() => {
                      setSelectedSectionId(sectionId);
                      setSelectedTaskId(groupedTasks[sectionId][0]?.id || '');
                    }}
                  >
                    {sectionId === 'Без раздела' ? 'Без раздела' : `Раздел ${sectionId}`}
                  </button>
                  {selectedSectionId === sectionId && (
                    <ul className="ml-4 mt-2 space-y-1">
                      {groupedTasks[sectionId].map((task) => (
                        <li key={task.id}>
                        <button
                            className={`w-full text-left px-2 py-1 rounded hover:bg-blue-50 text-sm transition-colors duration-200 ease-in-out ${selectedTaskId === task.id ? 'bg-blue-50 text-blue-800' : 'text-gray-600'}`}
                            onClick={() => setSelectedTaskId(task.id)}
                          >
                            {task.title}
                            {task.isCompleted && (
                              <span className="ml-2 text-green-600">✓</span>
                            )}
                        </button>
                      </li>
                    ))}
                  </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <section className="flex-1 max-w-3xl">
          {/* Breadcrumbs */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => setSelectedSectionId(sectionIds[0])} className="cursor-pointer">Задачи</BreadcrumbLink>
              </BreadcrumbItem>

              {selectedSectionId && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                     {/* Link or Span based on if a task is selected */} 
                     {task ? (
                         <BreadcrumbLink onClick={() => setSelectedSectionId(selectedSectionId)} className="cursor-pointer">
                             {selectedSectionId === 'Без раздела' ? 'Без раздела' : `Раздел ${selectedSectionId}`}
                         </BreadcrumbLink>
                     ) : (
                         <span className="text-gray-500">
                             {selectedSectionId === 'Без раздела' ? 'Без раздела' : `Раздел ${selectedSectionId}`}
                         </span>
                     )}
                  </BreadcrumbItem>
                </>
              )}

              {task && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-gray-900 font-semibold">{task.title}</span>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Task content */}
          {task ? (
            <div className="bg-white rounded-lg shadow p-8 transition-shadow duration-300 hover:shadow-xl ease-in-out">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                <span className="text-xs text-gray-400 font-mono">
                  {task.sectionNumber !== null ? `#${task.sectionNumber}` : 'Без раздела'}
                </span>
              </div>
              <div className="mb-4 text-gray-600 whitespace-pre-line">{task.description}</div>
              {task.files && task.files.length > 0 && (
                <div className="mb-4 transition-all duration-300 ease-in-out animate-fade-slide-in">
                  <h3 className="font-semibold text-gray-800 mb-1">Файлы:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {task.files.map((file: any) => ( // Use 'any' temporarily if file structure is not strict
                      <li key={file.url}>
                        <a href={file.url} download className="text-blue-600 hover:underline transition-colors">{file.name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex space-x-4 mb-6">
                <span className="text-sm text-gray-500">Сложность: {task.difficulty || 'Не указана'}</span>
                <span className="text-sm text-gray-500">Баллы: {task.points}</span>
                {/* Display category if available */}
                {task.category && <span className="text-sm text-gray-500">Категория: {task.category}</span>}
              </div>

              {/* Add area for user to submit answer */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-2">Ваш ответ:</h3>
                {/* Input for user answer */}
                <textarea
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Введите ваш ответ здесь..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                ></textarea>
                <button
                  className={`mt-2 px-4 py-2 bg-blue-600 text-white rounded-md transition-colors ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                  onClick={handleSubmitAnswer}
                  disabled={submitting}
                >
                  {submitting ? 'Отправка...' : 'Отправить ответ'}
                </button>
                {/* Display submission status */}
                {submissionStatus && (
                  <div className={`mt-2 p-3 rounded-md ${submissionStatus.score > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {submissionStatus.message} {submissionStatus.score > 0 && `(+${submissionStatus.score} баллов)`}
                  </div>
                )}
              </div>

              {/* Buttons for Solution and AI Chat */}
              <div className="mt-4 flex space-x-4">
                {/* We might conditionally show the solution later */}
                {task.isCompleted && (
                  <button 
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                    onClick={() => setShowAnswer(!showAnswer)}
                  >
                    {showAnswer ? 'Скрыть ответ' : 'Показать ответ'}
                  </button>
                )}

                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  onClick={() => setShowAIChat(!showAIChat)}
                >
                  {showAIChat ? 'Скрыть чат с ИИ' : 'Открыть чат с ИИ'}
                </button>
              </div>

              {/* Solution display area */}
              {showAnswer && task && (
                <div className="mt-4 bg-gray-100 p-4 rounded-md whitespace-pre-line transition-all duration-300 ease-in-out animate-fade-slide-in">
                    <h3 className="font-semibold text-gray-800 mb-2">Правильный ответ и решение:</h3>
                    {task.answer && (
                        <div className="mb-4">
                            <span className="font-semibold">Ответ:</span> 
                            <span className="bg-gray-200 rounded px-2 py-1 font-mono inline-block">{task.answer}</span>
                        </div>
                    )}
                    {task.solution && (
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">Решение:</h3>
                            <div>{task.solution}</div>
                        </div>
                    )}
                     {!task.answer && !task.solution && (
                        <p>Для этого задания нет ответа или решения.</p>
                    )}
                </div>
              )}

              {/* AI Chat Component */}
              {showAIChat && task && <AIChat taskTitle={task.title} />}

            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              Выберите раздел и задание из списка слева.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Keep AIChat component for now, potentially move to separate file later
function AIChat({ taskTitle }: { taskTitle: string }) {
  const [messages, setMessages] = useState<{
    text: string;
    sender: 'user' | 'ai'
  }[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setMessages([...messages, { text: input, sender: 'user' }])
      // Here you would typically send the input to your AI backend
      // and receive a response to add to messages
      console.log('User sent:', input, 'for task:', taskTitle); // Placeholder
      setInput('')
      // Example AI response (replace with actual API call)
    setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, { text: 'This is a placeholder AI response.', sender: 'ai' }]);
    }, 1000);
    }
  }

  return (
    <div className="mt-6 bg-blue-50 p-4 rounded-lg shadow-inner">
      <h3 className="font-semibold text-blue-800 mb-3">Чат с ИИ Ассистентом по заданию: {taskTitle}</h3>
      <div className="h-64 overflow-y-auto mb-3 p-2 bg-white rounded-md border border-gray-200">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Задайте вопрос об этом задании..."
          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Отправить
        </button>
      </form>
    </div>
  )
} 