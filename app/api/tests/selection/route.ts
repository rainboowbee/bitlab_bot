import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch a selection of tasks
    // For now, let's get a few random tasks. 
    // A more complex logic for selecting from different sections can be added later.
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        maxPoints: true,
        sectionNumber: true,
        // Exclude answer and solution
      },
      // To get random tasks, we can order by a random value or shuffle afterwards.
      // Ordering by a random value can be inefficient for large tables.
      // Let's just take a few for now.
      take: 10, // Get 10 tasks for the selection
      orderBy: { // Simple ordering, not truly random
        createdAt: 'desc'
      }
    });
    
    // Simple shuffling (client-side might be better for larger sets)
    // This is a basic example and might not be perfectly random or efficient
    const shuffledTasks = tasks.sort(() => Math.random() - 0.5);

    return NextResponse.json({ data: shuffledTasks });
  } catch (error) {
    console.error('Error fetching task selection:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 