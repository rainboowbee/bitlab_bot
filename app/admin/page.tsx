'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import Link from 'next/link';

interface AdminStats {
  totalStudents: number;
  totalTasks: number;
  totalVariants: number;
  sectionSuccessRates: {
    section: number;
    successRate: number;
  }[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  sectionNumber: number | null;
}

interface Variant {
  id: string;
  variantNumber: number;
  difficulty: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentVariants, setRecentVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || (session.user as any)?.isAdmin !== true) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsResponse, tasksResponse, variantsResponse] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/tasks?limit=3'),
          fetch('/api/admin/variants?limit=3')
        ]);

        if (!statsResponse.ok || !tasksResponse.ok || !variantsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [statsData, tasksData, variantsData] = await Promise.all([
          statsResponse.json(),
          tasksResponse.json(),
          variantsResponse.json()
        ]);

        setStats(statsData);
        setRecentTasks(tasksData.data);
        setRecentVariants(variantsData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

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

  if (!stats) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Нет данных для отображения.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Панель Администратора</h1>
        
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Общая статистика</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-blue-200 rounded-xl p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                <p className="text-sm text-blue-700 mb-2">Всего учеников</p>
                <p className="text-4xl font-extrabold text-blue-600">{stats.totalStudents}</p>
              </div>
              <div className="bg-white border border-purple-200 rounded-xl p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                <p className="text-sm text-purple-700 mb-2">Заданий в базе</p>
                <p className="text-4xl font-extrabold text-purple-600">{stats.totalTasks}</p>
              </div>
              <div className="bg-white border border-green-200 rounded-xl p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                <p className="text-sm text-green-700 mb-2">Количество вариантов</p>
                <p className="text-4xl font-extrabold text-green-600">{stats.totalVariants}</p>
              </div>
            </div>
          </div>

          {/* График успешности по разделам */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Процент решаемости по разделам</h2>
            <ChartContainer config={{
              'Процент успешных решений': {
                label: 'Процент успешных решений',
                color: 'hsl(var(--chart-1))',
              },
            }}>
              <BarChart data={stats.sectionSuccessRates.map(item => ({
                section: `Раздел ${item.section}`,
                'Процент успешных решений': Math.round(item.successRate * 100) / 100
              }))}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="section"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="Процент успешных решений" fill="var(--color-Процент-успешных-решений)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Последние задания и варианты */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Последние задания */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Последние задания</h2>
              <Link
                href="/admin/tasks"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Все задания
              </Link>
            </div>

            <div className="space-y-4">
              {recentTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className={`border rounded-lg p-4 transition-opacity ${
                    index === 0 ? 'opacity-100' : 
                    index === 1 ? 'opacity-70' : 'opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Макс. баллов: {task.maxPoints}</span>
                        {task.sectionNumber && (
                          <span className="ml-4 text-gray-500">Раздел: {task.sectionNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Последние варианты */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Последние варианты</h2>
              <Link
                href="/admin/variants"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Все варианты
              </Link>
            </div>

            <div className="space-y-4">
              {recentVariants.map((variant, index) => (
                <div 
                  key={variant.id} 
                  className={`border rounded-lg p-4 transition-opacity ${
                    index === 0 ? 'opacity-100' : 
                    index === 1 ? 'opacity-80' : 'opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Вариант {variant.variantNumber}</h3>
                      <p className="text-sm text-gray-600">
                        Сложность: {
                          variant.difficulty === 'easy' ? 'Легкий' :
                          variant.difficulty === 'medium' ? 'Средний' :
                          'Сложный'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 