'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthForm() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLogin, setIsLogin] = useState(pathname === '/auth/login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLogin(pathname === '/auth/login');
    setError('');
  }, [pathname]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка при входе');
        }

        router.push('/dashboard');
      } else {
        // Валидация полей
        if (!formData.email || !formData.password) {
          throw new Error('Email и пароль обязательны');
        }

        if (formData.password.length < 6) {
          throw new Error('Пароль должен содержать минимум 6 символов');
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Произошла ошибка при регистрации');
        }

        // После успешной регистрации перенаправляем на страницу входа
        router.push('/auth/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    const newPath = isLogin ? '/auth/register' : '/auth/login';
    router.push(newPath);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg fade-in card-hover">
      <div className="text-center mb-8 fade-in" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {isLogin ? 'Вход в систему' : 'Регистрация'}
        </h2>
        <p className="text-gray-600">
          {isLogin ? 'Добро пожаловать обратно!' : 'Создайте свой аккаунт'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 fade-in" style={{ animationDelay: '0.4s' }}>
        {!isLogin && (
          <div className="fade-in" style={{ animationDelay: '0.5s' }}>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Имя
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors form-input"
              placeholder="Введите ваше имя"
            />
          </div>
        )}

        <div className="fade-in" style={{ animationDelay: isLogin ? '0.5s' : '0.6s' }}>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors form-input"
            placeholder="Введите ваш email"
            required
          />
        </div>

        <div className="fade-in" style={{ animationDelay: isLogin ? '0.6s' : '0.7s' }}>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Пароль
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors form-input"
            placeholder="Введите ваш пароль"
            required
          />
        </div>

        {isLogin && (
          <div className="flex items-center justify-end fade-in" style={{ animationDelay: '0.7s' }}>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
              Забыли пароль?
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors fade-in button-hover ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ animationDelay: isLogin ? '0.8s' : '0.8s' }}
        >
          {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="mt-6 text-center fade-in" style={{ animationDelay: '0.9s' }}>
        <p className="text-gray-600">
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button
            onClick={toggleAuthMode}
            className="text-blue-600 hover:text-blue-700 font-medium button-hover"
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
} 