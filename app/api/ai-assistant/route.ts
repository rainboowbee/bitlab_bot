import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { message } = data;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const togetherApiKey = process.env.TOGETHER_API_KEY;
    if (!togetherApiKey) {
      console.error('TOGETHER_API_KEY is not set in environment variables.');
      return NextResponse.json({ error: 'Server configuration error: AI token not set.' }, { status: 500 });
    }

    const messages = [
      { "role": "user", "content": message }
    ];

    const togetherResponse = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${togetherApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!togetherResponse.ok) {
      const errorData = await togetherResponse.json();
      console.error('Error from Together AI API:', errorData);
      const errorMessage = errorData.message || errorData.error?.message || 'Failed to get response from AI.';
      return NextResponse.json({ error: errorMessage }, { status: togetherResponse.status });
    }

    const togetherData = await togetherResponse.json();
    let assistantMessage = togetherData.choices?.[0]?.message?.content || 'Не удалось получить ответ от ИИ.';

    // Обработка ответа: удаляем содержимое внутри тегов <think>...</think>
    const thinkTagEnd = assistantMessage.indexOf('</think>');
    if (thinkTagEnd !== -1) {
      // Находим конец тега и берем весь текст после него
      assistantMessage = assistantMessage.substring(thinkTagEnd + '</think>'.length).trim();
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Error in AI assistant API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 