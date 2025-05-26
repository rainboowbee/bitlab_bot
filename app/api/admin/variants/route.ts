import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const difficulty = searchParams.get('difficulty');

    const variants = await prisma.variant.findMany({
      where: {
        ...(difficulty ? { difficulty } : {})
      },
      orderBy: {
        variantNumber: 'asc'
      },
      ...(limit ? { take: parseInt(limit) } : {}),
      include: {
        tasks: true
      }
    });

    return NextResponse.json({ data: variants });
  } catch (error) {
    console.error('Error fetching variants:', error);
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
    const { variantNumber, difficulty, name, description, taskIds } = data;

    const variant = await prisma.variant.create({
      data: {
        variantNumber,
        difficulty,
        name,
        description,
        tasks: {
          connect: taskIds.map((id: string) => ({ id }))
        }
      }
    });

    return NextResponse.json({ data: variant });
  } catch (error) {
    console.error('Error creating variant:', error);
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
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { variantNumber, difficulty, name, description, taskIds } = data;

    const variant = await prisma.variant.update({
      where: { id },
      data: {
        variantNumber,
        difficulty,
        name,
        description,
        tasks: {
          set: taskIds.map((id: string) => ({ id }))
        }
      }
    });

    return NextResponse.json({ data: variant });
  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 