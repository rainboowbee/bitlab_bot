import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Проверка аутентификации пользователя
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, userAnswer } = body;

    if (!taskId || userAnswer === undefined) {
      return NextResponse.json({ error: 'Missing task ID or answer' }, { status: 400 });
    }

    // Fetch the task to get the correct answer and max points
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, answer: true, maxPoints: true }, // Select only necessary fields
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Simple answer checking (case-insensitive, trim whitespace)
    const isCorrect = task.answer?.trim().toLowerCase() === userAnswer.trim().toLowerCase();
    const score = isCorrect ? task.maxPoints : 0;

    // Record user activity
    const userActivity = await prisma.userTaskActivity.create({
      data: {
        userId: session.user.id,
        taskId: taskId,
        score: score,
        // completedAt is automatically set by @default(now())
      },
    });

    return NextResponse.json({ 
      message: isCorrect ? 'Ответ верный!' : 'Ответ неверный.', 
      score: score, 
      activityId: userActivity.id 
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}

// Optional: Add GET method to fetch a user's activity for a specific task
// export async function GET(request: Request) { ... } 