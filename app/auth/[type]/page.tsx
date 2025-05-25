import AuthForm from '../../components/AuthForm';
import { notFound } from 'next/navigation';

export default function AuthPage({ params }: { params: { type: string } }) {
  // Проверяем, что тип страницы - это либо login, либо register
  if (params.type !== 'login' && params.type !== 'register') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center mb-12 fade-in" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="text-blue-600">BitLab</span>
          </h1>
          <p className="text-gray-600">
            Ваш путь к успеху в мире IT начинается здесь
          </p>
        </div>
        
        <AuthForm />
      </div>
    </main>
  );
} 