import prisma from "../prisma/prisma-client";

export async function createMany(data: any[]) {
  await prisma.achievement.createMany({
    data,
    skipDuplicates: true,
  });
}

export async function findByName(name: string) {
  return await prisma.achievement.findFirst({
    where: {
      name,
    },
  });
}

export async function getCount() {
  return await prisma.achievement.count();
}

export async function getAllAchievements() {
  return await prisma.achievement.findMany();
}
