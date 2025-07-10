import { Preference, PrismaClient } from "@prisma/client";
import { updateUsersAvatarRepository } from "../repository/user-repository";
import * as userAchievementService from "./userAchievementService";

const prisma = new PrismaClient();

export const getUserPreferences = async (userId: string) => {
  try {
    const preferences = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferences: {
          select: {
            typeId: true,
            activityType: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!preferences) {
      throw new Error("Usuário não encontrado ou sem preferências");
    }

    return preferences.preferences.map((pref) => ({
      typeId: pref.typeId,
      typeName: pref.activityType.name,
      typeDescription: pref.activityType.description,
    }));
  } catch (error) {
    console.error("Erro ao buscar preferências:", error);
    throw new Error("Erro ao buscar as preferências");
  }
};

export const definePreference = async (userId: string, typeId: string) => {
  try {
    return await prisma.preference.upsert({
      where: {
        userId_typeId: {
          userId: userId,
          typeId: typeId,
        },
      },
      update: {
        typeId: typeId,
      },
      create: {
        userId: userId,
        typeId: typeId,
      },
    });
  } catch (error) {
    console.error("Erro ao definir a preferência:", error);
    throw new Error("Erro ao definir a preferência");
  }
};

export async function updateUsersAvatarService(
  imagePath: string,
  userId: string
) {
  try {
    const user = await prisma.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      throw { message: "Usuário não encontrado", status: 404 };
    }

    const updateAvatar = await updateUsersAvatarRepository(imagePath, userId);

    await userAchievementService.grantAchievement(
      "Personalização de Perfil",
      userId
    );

    return { avatar: updateAvatar.avatar };
  } catch (error) {
    throw error;
  }
}
