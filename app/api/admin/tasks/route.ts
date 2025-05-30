import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// import { PrismaClient, Task } from '@prisma/client'; // No longer needed here

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const section = searchParams.get('section');

    const tasks = await prisma.task.findMany({
      where: {
        ...(section ? { sectionNumber: parseInt(section) } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      ...(limit ? { take: parseInt(limit) } : {})
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { title, description, maxPoints, sectionNumber, answer, solution, files } = data;

    console.log('Полученные данные в POST:', { title, description, maxPoints, sectionNumber, answer, solution, files });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        maxPoints,
        sectionNumber,
        answer,
        solution,
        files
      }
    });

    console.log('Созданная задача:', task);

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { title, description, maxPoints, sectionNumber, answer, solution, files } = data;

    console.log('Полученные данные в PUT:', { title, description, maxPoints, sectionNumber, answer, solution, files });

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        maxPoints,
        sectionNumber,
        answer,
        solution,
        files
      }
    });

    console.log('Обновленная задача:', task);

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 