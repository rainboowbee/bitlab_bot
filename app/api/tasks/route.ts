import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Проверка аутентификации пользователя и наличие ID
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Получаем все задачи
    const tasks = await prisma.task.findMany({
      // Возможно, здесь нужно выбрать только определенные поля, исключая answer и solution для обычных пользователей
      // select: { id: true, title: true, description: true, maxPoints: true, sectionNumber: true, files: true, difficulty: true, category: true }
    });

    // Получаем активность пользователя по всем задачам
    const userActivities = await prisma.userTaskActivity.findMany({
      where: { userId: userId },
      select: { taskId: true, score: true }, // Выбираем только ID задачи и балл активности
    });

    // Создаем Map для быстрого доступа к активности по ID задачи
    const activityMap = new Map(userActivities.map(activity => [activity.taskId, activity]));

    // Обогащаем задачи информацией об активности пользователя
    const tasksWithActivity = tasks.map(task => ({
      ...task,
      // Проверяем, есть ли активность для данной задачи у пользователя
      userActivity: activityMap.get(task.id) || null,
      // Добавляем флаг, указывающий, решена ли задача (например, если есть активность с баллом > 0)
      isCompleted: activityMap.has(task.id) && (activityMap.get(task.id)!.score > 0), // Adjust logic based on how completion is defined
      userScore: activityMap.get(task.id)?.score || 0,
    }));
    
    return NextResponse.json({ data: tasksWithActivity });
  } catch (error) {
    console.error('Error fetching tasks and activity for user:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks and activity' }, { status: 500 });
  }
}

// Optional: Add GET method to fetch a user's activity for a specific task
// export async function GET(request: Request) { ... } 