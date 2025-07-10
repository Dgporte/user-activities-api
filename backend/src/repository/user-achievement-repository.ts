import prisma from "../prisma/prisma-client";

export async function create(data: { achievementId: string; userId: string }) {
  await prisma.userAchievement.create({
    data,
  });
}

export async function findAchievementsByUserId(userId: string) {
  return await prisma.userAchievement.findMany({
    where: {
      userId,
    },
    include: {
      achievement: true,
    },
  });
}

export async function findByAchievementIdAndUserId(
  achievementId: string,
  userId: string
) {
  return await prisma.userAchievement.findFirst({
    where: {
      userId,
      achievementId,
    },
  });
}
