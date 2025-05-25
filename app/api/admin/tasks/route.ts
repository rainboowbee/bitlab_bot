import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// import { PrismaClient, Task } from '@prisma/client'; // No longer needed here

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const session = await getServerSession(authOptions);

  // Проверка прав администратора
  // Временно обходим проверку типов с помощью as any
  if (!session || (session.user as any)?.isAdmin !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const tasks = await prisma.task.findMany();
    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error('Error fetching tasks for admin:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Проверка прав администратора
  // Временно обходим проверку типов с помощью as any
  if (!session || (session.user as any)?.isAdmin !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // Basic validation (can be expanded)
    if (!body.title || !body.description || typeof body.maxPoints !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        maxPoints: body.maxPoints,
        files: body.files, // Ensure this matches your schema type
        answer: body.answer,
        solution: body.solution,
        sectionNumber: body.sectionNumber ? parseInt(body.sectionNumber, 10) : null,
      },
    });

    return NextResponse.json({ data: newTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  // Проверка прав администратора
  // Временно обходим проверку типов с помощью as any
  if (!session || (session.user as any)?.isAdmin !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing task ID' }, { status: 400 });
    }

    const body = await request.json();
    // Basic validation (can be expanded)
    if (!body.title || !body.description || typeof body.maxPoints !== 'number') {
       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: id },
      data: {
        title: body.title,
        description: body.description,
        maxPoints: body.maxPoints,
        files: body.files, // Ensure this matches your schema type
        answer: body.answer,
        solution: body.solution,
        sectionNumber: body.sectionNumber ? parseInt(body.sectionNumber, 10) : null,
      },
    });

    return NextResponse.json({ data: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
} 