import { PrismaClient, User } from "@prisma/client";
import ActivityData from "../types/atividade.data"; // Se você estiver usando um tipo customizado
import {
  activityRepository,
  countActivities,
  createSubscription,
  deleteParticipation,
  findParticipation,
  findSubscription,
  getActivitiesByCreator,
  getAllActivities,
  userRepository,
} from "../repository/atividade-repository";
import { getParticipantsByActivity } from "../repository/atividade-repository";

const prisma = new PrismaClient();

export const createActivityService = async ({
  title,
  description,
  typeId,
  scheduledDate,
  image,
  privateActivity,
  completedAt,
  creatorId,
  latitude,
  longitude,
}: ActivityData) => {
  const activityType = await prisma.activityType.findUnique({
    where: { id: typeId },
  });

  if (!activityType) {
    throw new Error("O tipo de atividade fornecido não existe.");
  }

  const newActivity = await prisma.activity.create({
    data: {
      title,
      description,
      scheduledDate,
      image: image || "",
      private: privateActivity,
      createdAt: new Date(),
      completedAt: new Date(),
      type: { connect: { id: typeId } },
      creator: { connect: { id: creatorId } },
      activeAddress: {
        create: {
          latitude,
          longitude,
        },
      },
    },
    include: {
      creator: { select: { id: true, name: true, avatar: true } },
      type: { select: { name: true } },
      activeAddress: true,
    },
  });

  return {
    id: newActivity.id,
    title: newActivity.title,
    description: newActivity.description,
    type: newActivity.type.name,
    image: newActivity.image,
    active: newActivity.activeAddress
      ? {
          latitude: newActivity.activeAddress.latitude,
          longitude: newActivity.activeAddress.longitude,
        }
      : null,
    scheduledDate: newActivity.scheduledDate,
    createdAt: newActivity.createdAt,
    completedAt: newActivity.completedAt,
    private: newActivity.private,
    creator: {
      id: newActivity.creator.id,
      name: newActivity.creator.name,
      avatar: newActivity.creator.avatar,
    },
    userSubscribedStatus: "string",
  };
};

export const updateActivity = async ({
  id,
  title,
  description,
  typeId,
  image,
  latitude,
  longitude,
  scheduledDate,
  privateActivity,
  creatorId,
  completedAt,
}: {
  id: string;
  title: string;
  description: string;
  typeId: string;
  image: string;
  latitude: number;
  longitude: number;
  scheduledDate: Date;
  privateActivity: boolean;
  creatorId: string;
  completedAt: Date;
}) => {
  const isPrivate =
    typeof privateActivity === "boolean" ? privateActivity : false;

  const updatedActivity = await prisma.activity.update({
    where: { id },
    data: {
      title,
      description,
      type: { connect: { id: typeId } },
      image: image || "",
      activeAddress: {
        update: {
          latitude,
          longitude,
        },
      },
      scheduledDate,
      completedAt: completedAt || null,
      private: isPrivate,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      activeAddress: true,
    },
  });

  return {
    id: updatedActivity.id,
    title: updatedActivity.title,
    description: updatedActivity.description,
    image: updatedActivity.image,
    scheduledDate: updatedActivity.scheduledDate,
    createdAt: updatedActivity.createdAt,
    completedAt: updatedActivity.completedAt,
    private: updatedActivity.private,
    address: updatedActivity.activeAddress
      ? {
          latitude: updatedActivity.activeAddress.latitude,
          longitude: updatedActivity.activeAddress.longitude,
        }
      : null,
    creator: {
      id: updatedActivity.creator.id,
      name: updatedActivity.creator.name,
      avatar: updatedActivity.creator.avatar,
    },
    userSubscriptionStatus: "someStatus",
  };
};

export const deleteActivityService = async (activityId: string) => {
  try {
    await prisma.activeAddress.deleteMany({
      where: { activityId: activityId },
    });

    const deletedActivity = await prisma.activity.delete({
      where: { id: activityId },
    });

    return deletedActivity;
  } catch (error) {
    console.error("Erro ao excluir a atividade:", error);
    throw new Error("Erro ao excluir a atividade");
  }
};

export async function subscribeToActivity(userId: string, activityId: string) {
  const existingSubscription = await findSubscription(userId, activityId);

  if (existingSubscription) {
    throw new Error("Usuário já inscrito nesta atividade.");
  }

  return await createSubscription(userId, activityId);
}

export const cancelParticipationService = async (
  activityId: string,
  userId: string
) => {
  const participation = await findParticipation(activityId, userId);

  if (!participation) {
    throw new Error("Participação não encontrada.");
  }

  await deleteParticipation(activityId, userId);

  return { message: "Participação cancelada com sucesso." };
};

export const concludeActivityService = async (
  activityId: string,
  userId: string
) => {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    throw new Error("Atividade não encontrada.");
  }

  if (activity.creatorId !== userId) {
    throw new Error("Você não tem permissão para concluir esta atividade.");
  }

  const updatedActivity = await prisma.activity.update({
    where: { id: activityId },
    data: { completedAt: new Date() },
  });

  return { message: "Atividade concluída com sucesso.", updatedActivity };
};

export const getActivitiesByParticipant = async (userId: string) => {
  try {
    const activities = await activityRepository.getActivitiesByParticipant(
      userId
    );

    if (!activities || activities.length === 0) {
      throw new Error("Nenhuma atividade encontrada para o usuário");
    }

    return activities;
  } catch (error) {
    console.error("Erro ao buscar atividades:", error);
    throw new Error("Erro ao buscar as atividades");
  }
};

export const fetchActivityParticipants = async (activityId: string) => {
  try {
    const participants = await getParticipantsByActivity(activityId);

    if (!participants.length) {
      throw new Error("Nenhum participante encontrado para esta atividade.");
    }

    return participants.map(
      ({ id, userId, name, avatar, subscriptionStatus, confirmedAt }) => ({
        id,
        userId,
        name,
        avatar,
        subscriptionStatus: "Aprovado",
        confirmedAt: new Date(confirmedAt).toISOString(),
      })
    );
  } catch (error) {
    console.error("Erro ao buscar participantes:", error);
    throw new Error("Erro ao buscar os participantes da atividade.");
  }
};

export const getActivitiesByUserId = async (
  userId: string,
  page: number,
  pageSize: number
) => {
  const skip = (page - 1) * pageSize;

  const result = await prisma.activity.findMany({
    where: {
      participants: {
        some: {
          userId: userId,
        },
      },
    },
    skip,
    take: pageSize,
    include: {
      creator: true,
      type: true,
      participants: {
        where: {
          userId: userId,
        },
      },
    },
  });

  const totalActivities = await prisma.activity.count({
    where: {
      participants: {
        some: {
          userId: userId,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalActivities / pageSize);

  return {
    activities: result,
    totalActivities,
    totalPages,
  };
};

export const getActivitiesCreatedByUserId = async (userId: string) => {
  const result = await prisma.activity.findMany({
    where: {
      creatorId: userId,
    },
    include: {
      creator: true,
      type: true,
    },
  });

  return result;
};

export const getAllActivitiesService = async (
  typeId: string | undefined,
  page: number,
  pageSize: number,
  orderBy: string,
  order: string
) => {
  try {
    const activities = await getAllActivities(
      typeId,
      page,
      pageSize,
      orderBy,
      order
    );

    const totalActivities = await countActivities(typeId);
    const totalPages = Math.ceil(totalActivities / pageSize);

    return {
      page,
      pageSize,
      totalActivities,
      totalPages,
      activities,
    };
  } catch (error) {
    throw new Error("Erro ao buscar atividades.");
  }
};

export const getAllActivitiesServicePrin = async (
  typeId: string | undefined,
  page: number,
  pageSize: number,
  orderBy: string,
  order: string
) => {
  try {
    const activities = await getAllActivities(
      typeId,
      page,
      pageSize,
      orderBy,
      order
    );

    const totalActivities = await countActivities(typeId);
    const totalPages = Math.ceil(totalActivities / pageSize);

    return {
      page,
      pageSize,
      totalActivities,
      totalPages,
      activities,
      previous:
        page > 1 ? `/activities?page=${page - 1}&pageSize=${pageSize}` : null,
      next:
        page < totalPages
          ? `/activities?page=${page + 1}&pageSize=${pageSize}`
          : null,
    };
  } catch (error) {
    throw new Error("Erro ao buscar atividades.");
  }
};

export const checkInActivityService = async (
  id: string,
  confirmationCode: string,
  userId: string
) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: {
        id: id,
      },
      include: {
        participants: true,
      },
    });

    if (!activity) {
      throw new Error("Atividade não encontrada");
    }

    if (activity.confirmationCode !== confirmationCode) {
      throw new Error("Código de confirmação inválido");
    }

    const existingParticipation = await prisma.activityParticipant.findUnique({
      where: {
        activityId_userId: {
          activityId: id,
          userId: userId,
        },
      },
    });

    if (existingParticipation) {
      throw new Error("Usuário já fez check-in nesta atividade");
    }

    const newParticipant = await prisma.activityParticipant.create({
      data: {
        activityId: id,
        userId: userId,
        approved: true,
        confirmedAt: new Date(),
      },
    });

    return newParticipant;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("Erro desconhecido");
    }
  }
};

export const approveParticipationService = async (
  activityId: string,
  participantId: string,
  approved: boolean,
  userId: string
) => {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    throw new Error("Atividade não encontrada.");
  }

  if (activity.creatorId !== userId) {
    throw new Error(
      "Você não tem permissão para aprovar ou negar participantes desta atividade."
    );
  }

  const participant = await prisma.activityParticipant.findUnique({
    where: {
      activityId_userId: { activityId, userId: participantId },
    },
  });

  if (!participant) {
    throw new Error("Participante não encontrado nesta atividade.");
  }

  const updatedParticipant = await prisma.activityParticipant.update({
    where: {
      activityId_userId: { activityId, userId: participantId },
    },
    data: {
      approved,
      confirmedAt: approved ? new Date() : null,
    },
  });

  return updatedParticipant;
};
