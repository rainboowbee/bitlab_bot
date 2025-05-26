import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

    // Get total number of students (users who are not admins)
    const totalStudents = await prisma.user.count({
      where: { isAdmin: false }
    });

    // Get total number of tasks
    const totalTasks = await prisma.task.count();

    // Get total number of variants
    const totalVariants = await prisma.variant.count();

    // Get success rate by section
    const tasksWithActivities = await prisma.task.findMany({
      include: {
        activities: true
      }
    });

    const sectionStats = tasksWithActivities.reduce((acc: { [key: number]: { total: number; successful: number } }, task) => {
      const section = task.sectionNumber || 0;
      if (!acc[section]) {
        acc[section] = { total: 0, successful: 0 };
      }
      
      task.activities.forEach(activity => {
        acc[section].total++;
        if (activity.score > 0) {
          acc[section].successful++;
        }
      });
      
      return acc;
    }, {});

    const sectionSuccessRates = Object.entries(sectionStats).map(([section, stats]) => ({
      section: parseInt(section),
      successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
    }));

    return NextResponse.json({
      totalStudents,
      totalTasks,
      totalVariants,
      sectionSuccessRates
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 