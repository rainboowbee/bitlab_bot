import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { taskId, taskDescription } = data;

    if (!taskId || !taskDescription) {
      return NextResponse.json({ error: 'Task ID and description are required' }, { status: 400 });
    }

    // Проверка наличия токена OpenAI в переменных окружения
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error: AI token not set.' }, { status: 500 });
    }

    // Подготовка сообщения для модели ИИ (используем формат сообщений OpenAI)
    const messages = [
      { "role": "system", "content": "You are a helpful assistant that explains programming tasks." },
      { "role": "user", "content": `Помоги объяснить задачу. Вот описание задачи: ${taskDescription}. Объясни подробно.` }
    ];

    // Вызов API OpenAI для чат-комплиций
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Можете выбрать другую модель, например, 'gpt-4'
        messages: messages,
        max_tokens: 1024, // Ограничим количество генерируемых токенов
        temperature: 0.7, // Контроль случайности (0.0 - детерминированный, 1.0 - более случайный)
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('Error from OpenAI API:', errorData);
      // Попробуем извлечь сообщение об ошибке из разных полей ответа OpenAI
      const errorMessage = errorData.error?.message || errorData.message || 'Failed to get explanation from AI.';
      return NextResponse.json({ error: errorMessage }, { status: openaiResponse.status });
    }

    const openaiData = await openaiResponse.json();

    // Извлекаем сгенерированное объяснение из ответа модели OpenAI
    const explanation = openaiData.choices?.[0]?.message?.content || 'Не удалось получить объяснение от ИИ.';

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error in explain-task API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 