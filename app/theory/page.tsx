'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../components/Header';

interface TheorySection {
  id: string;
  title: string;
  description: string;
  topics: {
    id: string;
    title: string;
    description: string;
    duration: string;
    completed: boolean;
  }[];
}

export default function Theory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sections, setSections] = useState<TheorySection[]>([
    {
      id: '1',
      title: 'Основы программирования',
      description: 'Базовые концепции и принципы программирования',
      topics: [
        {
          id: '1-1',
          title: 'Введение в программирование',
          description: 'Что такое программирование и как оно работает',
          duration: '30 мин',
          completed: false,
        },
        {
          id: '1-2',
          title: 'Переменные и типы данных',
          description: 'Работа с переменными и различными типами данных',
          duration: '45 мин',
          completed: false,
        },
        {
          id: '1-3',
          title: 'Условные операторы',
          description: 'Использование if, else и switch',
          duration: '40 мин',
          completed: false,
        },
      ],
    },
    {
      id: '2',
      title: 'Алгоритмы и структуры данных',
      description: 'Основные алгоритмы и структуры данных',
      topics: [
        {
          id: '2-1',
          title: 'Массивы и списки',
          description: 'Работа с массивами и связанными списками',
          duration: '50 мин',
          completed: false,
        },
        {
          id: '2-2',
          title: 'Сортировка и поиск',
          description: 'Основные алгоритмы сортировки и поиска',
          duration: '60 мин',
          completed: false,
        },
      ],
    },
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Теория</h1>
        
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {section.title}
                </h2>
                <p className="text-gray-600 mb-4">{section.description}</p>
                
                <div className="space-y-4">
                  {section.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {topic.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {topic.description}
                          </p>
                          <span className="text-sm text-gray-500">
                            Длительность: {topic.duration}
                          </span>
                        </div>
                        <button
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            topic.completed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {topic.completed ? 'Завершено' : 'Начать изучение'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 