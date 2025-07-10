import prisma from "../prisma/prisma-client";
import userData from "../types/user.data";

export async function getAll() {
  return await prisma.user.findMany();
}

export const create = async ({
  name,
  email,
  password,
  cpf,
}: {
  name: string;
  email: string;
  password: string;
  cpf: string;
}) => {
  return prisma.user.create({
    data: {
      name,
      email,
      password,
      cpf,
      avatar: "",
      xp: 0,
      level: 1,
    },
  });
};

export async function getById(id: string) {
  return await prisma.user.findUnique({
    where: {
      id,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
    },
  });
}

export async function update(
  data: { name: string; email: string; cpf: string },
  id: string
) {
  const userExists = await prisma.user.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!userExists) {
    return null;
  }

  return await prisma.user.update({
    where: {
      id,
      deletedAt: null,
    },
    data,
    select: {
      name: true,
      email: true,
      cpf: true,
    },
  });
}

export async function softDelete(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new Error("Usuário não encontrado ou já deletado");
  }

  return await prisma.user.update({
    where: {
      id,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
    },
  });
}

export const getUserPreferences = async (userId: string) => {
  const preferences = await prisma.preference.findMany({
    where: { userId },
    select: {
      typeId: true,
      activityType: {
        select: {
          name: true,
          description: true,
        },
      },
    },
  });

  return preferences.map((preference) => ({
    typeId: preference.typeId,
    typeName: preference.activityType.name,
    typeDescription: preference.activityType.description,
  }));
};

export async function updateUsersAvatarRepository(
  image: string,
  userId: string
) {
  try {
    const existingUser = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!existingUser) {
      throw { message: "Usuário não encontrado.", status: 404 };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: image },
      select: {
        id: true,
        avatar: true,
      },
    });

    return updatedUser;
  } catch (error) {
    throw error;
  }
}

export async function updateUserXP(userId: string, xpToAdd: number) {
  // Primeiro, busca o usuário atual para verificar seu XP e nível
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      xp: true,
      level: true,
    },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  // Calcula o novo XP
  const newXP = user.xp + xpToAdd;

  // Calcula o novo nível baseado no XP
  // A fórmula para calcular o nível pode ser ajustada conforme necessário
  // Aqui estamos usando uma fórmula simples: cada 100 XP = 1 nível
  const xpPerLevel = 100;
  const newLevel = Math.floor(newXP / xpPerLevel) + 1;

  // Atualiza o usuário com o novo XP e possivelmente o novo nível
  return await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXP,
      level: newLevel,
    },
    select: {
      id: true,
      xp: true,
      level: true,
      name: true,
    },
  });
}

export async function getUserWithAchievements(userId: string) {
  return await prisma.user.findUnique({
    where: {
      id: userId,
      deletedAt: null,
    },
    include: {
      achievements: {
        include: {
          achievement: true,
        },
      },
    },
  });
}
