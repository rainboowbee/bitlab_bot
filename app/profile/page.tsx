'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '../components/Header';

// Удаляем старые импорты Chart.js и react-chartjs-2
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import { Line, Bar } from 'react-chartjs-2';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// Импортируем компоненты графиков из shadcn/ui
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

// Импорт компонентов Dialog из shadcn/ui
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

// Импорт компонентов Form из shadcn/ui (Label, Input, Button)
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface UserStatsData {
  month: string;
  average: number;
  count: number;
}

interface DailyStatsData {
  day: string;
  count: number;
}

interface UserApiData {
  monthlyStats: {
    month: string;
    averageScore: number;
  }[];
  dailyStats: number[];
  totalUniqueTasks: number;
  successRate: number;
  totalCompletedVariants?: number;
}

export default function Profile() { // Изменено имя компонента на Profile
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State для диалогового окна смены пароля
  const [isPasswordChangeDialogOpen, setIsPasswordChangeDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    } else if (status === 'authenticated') {
      const fetchUserData = async () => {
        try {
          const response = await fetch('/api/user-stats');
          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }
          const data = await response.json();
          setUserData(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Ошибка загрузки статистики: {error}</div>;
  }

  if (!userData) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Нет данных для отображения.</div>;
  }

  // Prepare data for monthly progress chart (for Recharts)
  const monthlyChartDataRecharts = userData.monthlyStats.map(stat => ({
    month: stat.month,
    'Средний балл': stat.averageScore,
  }));

  // Prepare data for daily tasks chart (for Recharts)
  const dailyChartDataRecharts = userData.dailyStats.map((count, index) => {
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return {
      day: dayNames[index],
      'Решенные задачи': count,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Профиль пользователя</h1>

        {/* Секция с данными профиля */}
        {session?.user && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Данные профиля</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Имя:</p>
                <p className="text-lg text-gray-900">{session.user.name || 'Не указано'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email:</p>
                <p className="text-lg text-gray-900">{session.user.email || 'Не указан'}</p>
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={() => setIsPasswordChangeDialogOpen(true)}>Сменить пароль</Button>
            </div>
          </div>
        )}

        {/* Диалоговое окно смены пароля */}
        <Dialog open={isPasswordChangeDialogOpen} onOpenChange={setIsPasswordChangeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Смена пароля</DialogTitle>
              <DialogDescription>
                Введите ваш старый пароль и новый пароль для смены.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="old-password" className="text-right">Старый пароль</Label>
                <Input
                  id="old-password"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">Новый пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirm-new-password" className="text-right">Подтвердите новый пароль</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="col-span-3"
                />
              </div>
              {passwordChangeError && <p className="text-red-500 text-sm col-span-4 text-center">{passwordChangeError}</p>}
              {passwordChangeSuccess && <p className="text-green-500 text-sm col-span-4 text-center">{passwordChangeSuccess}</p>}
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => {
                // TODO: Implement password change logic here
                console.log('Change password attempt', { oldPassword, newPassword, confirmNewPassword });
                setPasswordChangeError(null); // Clear previous errors
                setPasswordChangeSuccess(null); // Clear previous success messages

                if (newPassword !== confirmNewPassword) {
                  setPasswordChangeError('Новые пароли не совпадают.');
                  return;
                }

                // Placeholder for API call
                // try {
                //   const res = await fetch('/api/user/change-password', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ oldPassword, newPassword }),
                //   });
                //   const data = await res.json();
                //   if (!res.ok) {
                //     setPasswordChangeError(data.error || 'Ошибка при смене пароля.');
                //   } else {
                //     setPasswordChangeSuccess('Пароль успешно изменен!');
                //     setOldPassword('');
                //     setNewPassword('');
                //     setConfirmNewPassword('');
                //     // Optionally close dialog after success
                //     // setIsPasswordChangeDialogOpen(false);
                //   }
                // } catch (err: any) {
                //   setPasswordChangeError(err.message || 'Произошла ошибка сети.');
                // }

                 // Simulate success/error for now
                 if (oldPassword === 'correct_old_password') { // Замените на реальную проверку или API вызов
                    setPasswordChangeSuccess('Пароль успешно изменен (симуляция)!\nРеализация API требуется.');
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                 } else {
                    setPasswordChangeError('Неверный старый пароль (симуляция)!\nРеализация API требуется.');
                 }

              }}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Статистика */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Статистика</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-blue-200 rounded-xl p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                <p className="text-sm text-blue-700 mb-2">Выполнено задач (всего)</p>
                <p className="text-4xl font-extrabold text-blue-600">{userData.totalUniqueTasks}</p>
              </div>
              <div className="bg-white border border-purple-200 rounded-xl p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                <p className="text-sm text-purple-700 mb-2">Выполнено вариантов</p>
                <p className="text-4xl font-extrabold text-purple-600">{userData.totalCompletedVariants ?? 0}</p>
              </div>
              <div className="bg-white border border-green-200 rounded-xl p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                <p className="text-sm text-green-700 mb-2">Процент успешных решений</p>
                <p className="text-4xl font-extrabold text-green-600">{userData.successRate}%</p>
              </div>
            </div>
          </div>

          {/* График прогресса */}
          <div className="bg-white rounded-lg shadow p-6 transition-shadow duration-300 ease-in-out hover:shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Динамика прогресса</h2>
            <ChartContainer config={{
               'Решенные задачи': {
                label: 'Решенные задачи',
                color: 'hsl(var(--chart-1))',
              },
            }}>
              <BarChart accessibilityLayer data={dailyChartDataRecharts}>
                 <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="Решенные задачи" fill="var(--color-Решенные-задачи)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          {/* График задач по дням недели */}
          {/* Удален график "Задачи по дням недели", так как "Динамика прогресса" теперь показывает те же данные. */}

        </div>
      </main>
    </div>
  );
} 