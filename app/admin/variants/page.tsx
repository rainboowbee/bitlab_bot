'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';

interface Variant {
  id: string;
  variantNumber: number;
  name: string | null;
  description: string | null;
  difficulty: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  sectionNumber: number | null;
}

export default function VariantsEditor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [formData, setFormData] = useState<Partial<Variant>>({});
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [selectedTaskSection, setSelectedTaskSection] = useState<number | null>(null);
  const [taskSections, setTaskSections] = useState<number[]>([]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || (session.user as any)?.isAdmin !== true) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [variantsResponse, tasksResponse] = await Promise.all([
          fetch('/api/admin/variants'),
          fetch('/api/admin/tasks')
        ]);

        if (!variantsResponse.ok || !tasksResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [variantsData, tasksData] = await Promise.all([
          variantsResponse.json(),
          tasksResponse.json()
        ]);

        setVariants(variantsData.data);
        setTasks(tasksData.data);

        const uniqueSections = Array.from(new Set(tasksData.data
          .map((task: Task) => task.sectionNumber)
          .filter((section: number | null) => section !== null)
        )).sort((a, b) => (a || 0) - (b || 0));
        setTaskSections(uniqueSections as number[]);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setFormData(variant);
    setSelectedTaskIds(variant.tasks.map(task => task.id));
  };

  const handleSaveVariant = async () => {
    if (!formData) return;

    try {
      const method = editingVariant ? 'PUT' : 'POST';
      const url = editingVariant ? `/api/admin/variants?id=${editingVariant.id}` : '/api/admin/variants';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantNumber: formData.variantNumber,
          name: formData.name,
          description: formData.description,
          difficulty: formData.difficulty,
          taskIds: selectedTaskIds
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save variant');
      }

      const updatedVariants = await fetch('/api/admin/variants').then(res => res.json());
      setVariants(updatedVariants.data);
      setEditingVariant(null);
      setFormData({});
      setSelectedTaskIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save variant');
    }
  };

  const handleTaskCheckboxChange = (taskId: string, isChecked: boolean) => {
    setSelectedTaskIds(prevSelected => 
      isChecked ? [...prevSelected, taskId] : prevSelected.filter(id => id !== taskId)
    );
  };

  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.variantNumber.toString().includes(searchQuery) ||
                          (variant.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (variant.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === null || variant.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const availableTasks = tasks;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(taskSearchQuery.toLowerCase());
    const matchesSection = selectedTaskSection === null || task.sectionNumber === selectedTaskSection;
    return matchesSearch && matchesSection;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Редактор вариантов</h1>
          <Link
            href="/admin"
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Назад к панели
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск по вариантам</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по номеру, названию или описанию варианта..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сложность варианта</label>
              <select
                value={selectedDifficulty || ''}
                onChange={(e) => setSelectedDifficulty(e.target.value || null)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">Все сложности</option>
                <option value="easy">Легкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </select>
            </div>
          </div>
        </div>

        {editingVariant || Object.keys(formData).length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingVariant ? 'Редактирование варианта' : 'Новый вариант'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Номер варианта</label>
                <input
                  type="number"
                  value={formData.variantNumber || ''}
                  onChange={(e) => setFormData({ ...formData, variantNumber: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Название варианта</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Описание</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Сложность</label>
                <select
                  value={formData.difficulty || ''}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Выберите сложность</option>
                  <option value="easy">Легкий</option>
                  <option value="medium">Средний</option>
                  <option value="hard">Сложный</option>
                </select>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-2">Выберите задания для варианта:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Поиск заданий</label>
                    <input
                      type="text"
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      placeholder="Поиск по названию или описанию задания..."
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Раздел задания</label>
                    <select
                      value={selectedTaskSection || ''}
                      onChange={(e) => setSelectedTaskSection(e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="">Все разделы</option>
                      {taskSections.map(section => (
                        <option key={section} value={section}>Раздел {section}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                  {filteredTasks.map(task => (
                    <div key={task.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`task-${task.id}`}
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={(e) => handleTaskCheckboxChange(task.id, e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`task-${task.id}`} className="text-sm text-gray-700">
                        {task.title} (Раздел: {task.sectionNumber || 'Не указан'})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setEditingVariant(null);
                    setFormData({});
                    setSelectedTaskIds([]);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveVariant}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditingVariant(null);
              setFormData({ variantNumber: variants.length > 0 ? variants[variants.length - 1].variantNumber + 1 : 1, name: '', description: '', difficulty: '' });
              setSelectedTaskIds([]);
            }}
            className="mb-8 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            Новый вариант
          </button>
        )}

        <div className="space-y-4">
          {filteredVariants.map((variant) => (
            <div key={variant.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Вариант {variant.variantNumber}{variant.name ? `: ${variant.name}` : ''}</h3>
                  {variant.description && <p className="mt-2 text-gray-600">{variant.description}</p>}
                  <p className="mt-2 text-sm text-gray-600">
                    Сложность: {
                      variant.difficulty === 'easy' ? 'Легкий' :
                      variant.difficulty === 'medium' ? 'Средний' :
                      'Сложный'
                    }
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    Заданий: {variant.tasks.length}
                  </div>
                </div>
                <button
                  onClick={() => handleEditVariant(variant)}
                  className="text-green-500 hover:text-green-600"
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