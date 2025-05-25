import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ID пользователя, для которого добавляем тестовые данные
  const targetUserId = 'cmaygm83z0000on64b4jw4sb'; // Замените на нужный ID

  // Находим существующего пользователя по ID
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    console.error(`Пользователь с ID ${targetUserId} не найден.`);
    process.exit(1);
  }

  console.log('Используется существующий пользователь:', user.email);

  // Создание тестовых задач
  const task1 = await prisma.task.upsert({
    where: { id: 'task1' },
    update: {},
    create: {
      id: 'task1',
      title: 'Задача 1',
      description: 'Первая тестовая задача.',
      maxPoints: 100,
    },
  });

  const task2 = await prisma.task.upsert({
    where: { id: 'task2' },
    update: {},
    create: {
      id: 'task2',
      title: 'Задача 2',
      description: 'Вторая тестовая задача.',
      maxPoints: 150,
    },
  });

  const task3 = await prisma.task.upsert({
    where: { id: 'task3' },
    update: {},
    create: {
      id: 'task3',
      title: 'Задача 3',
      description: 'Третья тестовая задача.',
      maxPoints: 200,
    },
  });

  console.log('Тестовые задачи созданы или обновлены.');

  // Создание тестовой активности пользователя за несколько месяцев
  const activitiesData = [
    // Активность в Мае 2024
    { userId: user.id, taskId: task1.id, completedAt: new Date('2024-05-10T10:00:00Z'), score: 90 },
    { userId: user.id, taskId: task2.id, completedAt: new Date('2024-05-15T11:00:00Z'), score: 130 },
    { userId: user.id, taskId: task1.id, completedAt: new Date('2024-05-20T12:00:00Z'), score: 85 },

    // Активность в Июне 2024
    { userId: user.id, taskId: task3.id, completedAt: new Date('2024-06-05T10:30:00Z'), score: 180 },
    { userId: user.id, taskId: task2.id, completedAt: new Date('2024-06-12T14:00:00Z'), score: 145 },

    // Активность в Июле 2024
    { userId: user.id, taskId: task1.id, completedAt: new Date('2024-07-01T09:00:00Z'), score: 95 },
    { userId: user.id, taskId: task3.id, completedAt: new Date('2024-07-18T16:00:00Z'), score: 190 },
    { userId: user.id, taskId: task2.id, completedAt: new Date('2024-07-25T11:30:00Z'), score: 140 },
  ];

  // Удаляем старые тестовые активности для пользователя, чтобы избежать дубликатов при повторном сидировании
  await prisma.userTaskActivity.deleteMany({
    where: { userId: user.id },
  });

  // Создание записей активности
  for (const activity of activitiesData) {
    await prisma.userTaskActivity.create({
      data: activity,
    });
  }

  console.log('Тестовая активность пользователя создана.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 