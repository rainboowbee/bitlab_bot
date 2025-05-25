'use client';

import Header from '../components/Header';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <Header />
      <div className="text-center text-gray-600 mt-8">
        <h1 className="text-2xl font-bold mb-4">Страница статистики перенесена</h1>
        <p>Статистика теперь доступна в разделе "Профиль".</p>
      </div>
    </div>
  );
} 