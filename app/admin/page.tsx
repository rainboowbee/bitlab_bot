'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '../components/Header';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Ждем загрузки сессии

    // Перенаправляем, если пользователь не авторизован или не админ
    if (!session || session.user?.isAdmin !== true) {
      router.push('/'); // Или на страницу 403 Forbidden, если такая есть
    }
  }, [session, status, router]);

  if (status === 'loading' || !session || session.user?.isAdmin !== true) {
    // Отображаем индикатор загрузки или ничего, пока идет проверка
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Здесь будет содержимое админ-панели для администраторов
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Панель Администратора</h1>
        {/* TODO: Добавить навигацию и компоненты для управления */}
        <div>
          <p>Добро пожаловать, Администратор {session.user.name}!</p>
          {/* Пример ссылки на раздел управления задачами */}
          {/* <Link href="/admin/tasks">Управление задачами</Link> */}
        </div>
      </main>
    </div>
  );
} 