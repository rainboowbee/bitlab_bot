import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user activities
    const activities: Prisma.UserTaskActivityGetPayload<{}>[] = await prisma.userTaskActivity.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Calculate total unique tasks and success rate
    const uniqueTasks = new Set(activities.map((activity) => activity.taskId));
    const totalAttempts = activities.length;
    const successfulAttempts = activities.filter((activity) => activity.score > 0).length;
    const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

    // Group activities by month for monthly statistics
    const monthlyStats = activities.reduce((acc: { [key: string]: { total: number; count: number } }, activity) => {
      const month = activity.completedAt.toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { total: 0, count: 0 };
      }
      acc[month].total += activity.score;
      acc[month].count += 1;
      return acc;
    }, {});

    // Calculate monthly averages
    const monthlyAverages = Object.entries(monthlyStats).map(([month, stats]: [string, { total: number; count: number }]) => ({
      month,
      averageScore: stats.count > 0 ? stats.total / stats.count : 0,
    }));

    // Calculate daily statistics for the current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Initialize array for daily stats
    const dailyStats = Array(7).fill(0);

    // Filter activities for current week and count tasks by day
    activities
      .filter(activity => {
        const activityDate = new Date(activity.completedAt);
        return activityDate >= startOfWeek && activityDate < endOfWeek;
      })
      .forEach(activity => {
        const dayIndex = new Date(activity.completedAt).getDay();
        if (activity.score > 0) { // Only count successful attempts
          dailyStats[dayIndex]++;
        }
      });

    return NextResponse.json({
      monthlyStats: monthlyAverages,
      dailyStats,
      totalUniqueTasks: uniqueTasks.size,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 