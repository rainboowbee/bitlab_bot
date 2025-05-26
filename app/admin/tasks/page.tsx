'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  sectionNumber: number | null;
  answer: string | null;
  solution: string | null;
  files: any | null;
}

export default function TasksEditor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [sections, setSections] = useState<number[]>([]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || (session.user as any)?.isAdmin !== true) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data.data);
        
        // Получаем уникальные номера разделов
        const uniqueSections = Array.from(new Set(data.data
          .map((task: Task) => task.sectionNumber)
          .filter((section: number | null) => section !== null)
        )).sort((a, b) => (a || 0) - (b || 0));
        setSections(uniqueSections as number[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData(task);
  };

  const handleSaveTask = async () => {
    if (!formData) return;

    try {
      const method = editingTask ? 'PUT' : 'POST';
      const url = editingTask ? `/api/admin/tasks?id=${editingTask.id}` : '/api/admin/tasks';

      const taskData = {
        title: formData.title,
        description: formData.description,
        maxPoints: formData.maxPoints,
        sectionNumber: formData.sectionNumber,
        answer: formData.answer || null,
        solution: formData.solution || null,
        files: formData.files || null
      };

      console.log('Отправляемые данные:', taskData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save task');
      }

      // Обновляем список задач
      const updatedTasks = await fetch('/api/admin/tasks').then(res => res.json());
      setTasks(updatedTasks.data);
      setEditingTask(null);
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = selectedSection === null || task.sectionNumber === selectedSection;
    return matchesSearch && matchesSection;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Ошибка загрузки данных: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Редактор заданий</h1>
          <Link
            href="/admin"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Назад к панели
          </Link>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или описанию..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Раздел</label>
              <select
                value={selectedSection || ''}
                onChange={(e) => setSelectedSection(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Все разделы</option>
                {sections.map(section => (
                  <option key={section} value={section}>Раздел {section}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Форма редактирования */}
        {editingTask || Object.keys(formData).length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingTask ? 'Редактирование задания' : 'Новое задание'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Название</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Описание</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Макс. баллов</label>
                <input
                  type="number"
                  value={formData.maxPoints || 0}
                  onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Номер раздела</label>
                <input
                  type="number"
                  value={formData.sectionNumber || ''}
                  onChange={(e) => setFormData({ ...formData, sectionNumber: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ответ</label>
                <input
                  type="text"
                  value={formData.answer || ''}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Решение</label>
                <textarea
                  value={formData.solution || ''}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ссылка на файл</label>
                <input
                  type="text"
                  value={formData.files?.url || ''}
                  onChange={(e) => setFormData({ ...formData, files: { url: e.target.value } })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setFormData({});
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveTask}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditingTask(null);
              setFormData({
                title: '',
                description: '',
                maxPoints: 0,
                sectionNumber: null,
                answer: '',
                solution: '',
                files: { url: '' }
              });
            }}
            className="mb-8 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Новое задание
          </button>
        )}

        {/* Список заданий */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
                  <p className="mt-2 text-gray-600">{task.description}</p>
                  <div className="mt-4 flex space-x-4 text-sm text-gray-500">
                    <span>Макс. баллов: {task.maxPoints}</span>
                    {task.sectionNumber && (
                      <span>Раздел: {task.sectionNumber}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEditTask(task)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Редактировать
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 