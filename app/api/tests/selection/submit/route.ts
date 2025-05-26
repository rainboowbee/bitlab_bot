import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const data = await request.json();
    const { taskId, answer } = data;

    if (!taskId || answer === undefined) {
      return NextResponse.json(
        { error: 'Task ID and answer are required' },
        { status: 400 }
      );
    }

    // Fetch the task to check the correct answer (assuming answer and solution are in Task model)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { answer: true, maxPoints: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Simple check if the answer is correct (case-insensitive and trim whitespace)
    const isCorrect = task.answer?.trim().toLowerCase() === answer.trim().toLowerCase();
    const pointsAwarded = isCorrect ? task.maxPoints : 0;

    // Record user activity
    const userActivity = await prisma.userTaskActivity.create({
      data: {
        userId: userId,
        taskId: taskId,
        score: pointsAwarded,
      },
    });

    return NextResponse.json({ data: userActivity, isCorrect: isCorrect, pointsAwarded: pointsAwarded, correctAnswer: task.answer });
  } catch (error) {
    console.error('Error submitting task answer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 