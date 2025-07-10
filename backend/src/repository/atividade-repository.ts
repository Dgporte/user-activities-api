import { User } from "@prisma/client";
import prisma from "../prisma/prisma-client";

export const createActivity = async ({
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
  title: string;
  description: string;
  typeId: string;
  image: string;
  scheduledDate: Date;
  latitude: number;
  longitude: number;
  privateActivity: boolean;
  completedAt: Date;
  creatorId: string;
}) => {
  const isPrivate =
    typeof privateActivity === "boolean" ? privateActivity : false;

  const activity = await prisma.activity.create({
    data: {
      title,
      description,
      type: { connect: { id: typeId } },
      image: image || "",
      activeAddress: {
        create: {
          latitude,
          longitude,
        },
      },
      scheduledDate,
      createdAt: new Date(),
      completedAt: new Date(),
      creator: { connect: { id: creatorId } },
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
    id: activity.id,
    title: activity.title,
    description: activity.description,
    image: activity.image,
    scheduledDate: activity.scheduledDate,
    createdAt: activity.createdAt,
    completedAt: activity.completedAt || null,
    private: activity.private,
    address: activity.activeAddress
      ? {
          latitude: activity.activeAddress.latitude,
          longitude: activity.activeAddress.longitude,
        }
      : null,
    creator: {
      id: activity.creator.id,
      name: activity.creator.name,
      avatar: activity.creator.avatar,
    },
    userSubscriptionStatus: "someStatus",
  };
};

export async function getAllTypes() {
  return await prisma.activityType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
    },
  });
}

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
  scheduledDate: Date;
  latitude: number;
  longitude: number;
  privateActivity: boolean;
  completedAt: Date;
  creatorId: string;
}) => {
  const isPrivate =
    typeof privateActivity === "boolean" ? privateActivity : false;

  const activity = await prisma.activity.update({
    where: { id },
    data: {
      title,
      description,
      type: { connect: { id: typeId } },
      image: image || "",
      activeAddress: {
        upsert: {
          where: { activityId: id },
          update: { latitude, longitude },
          create: { latitude, longitude },
        },
      },
      scheduledDate,
      completedAt,
      creator: { connect: { id: creatorId } },
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
    id: activity.id,
    title: activity.title,
    description: activity.description,
    image: activity.image,
    scheduledDate: activity.scheduledDate,
    createdAt: activity.createdAt,
    completedAt: activity.completedAt || null,
    private: activity.private,
    address: activity.activeAddress
      ? {
          latitude: activity.activeAddress.latitude,
          longitude: activity.activeAddress.longitude,
        }
      : null,
    creator: {
      id: activity.creator.id,
      name: activity.creator.name,
      avatar: activity.creator.avatar,
    },
    userSubscriptionStatus: "someStatus",
  };
};

export async function findSubscription(userId: string, activityId: string) {
  return await prisma.activityParticipant.findFirst({
    where: { userId, activityId },
  });
}

export async function createSubscription(userId: string, activityId: string) {
  return await prisma.activityParticipant.create({
    data: {
      userId,
      activityId,
      approved: false,
    },
  });
}

export const findParticipation = async (activityId: string, userId: string) => {
  return await prisma.activityParticipant.findUnique({
    where: {
      activityId_userId: {
        activityId,
        userId,
      },
    },
  });
};

export const deleteParticipation = async (
  activityId: string,
  userId: string
) => {
  return await prisma.activityParticipant.delete({
    where: {
      activityId_userId: {
        activityId,
        userId,
      },
    },
  });
};

export const getActivitiesByCreator = async (creatorId: string) => {
  const activities = await prisma.activity.findMany({
    where: {
      creatorId,
      deletedAt: null,
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
      participants: true,
      type: true,
    },
  });

  return activities.map((activity) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description,
    type: activity.type.name,
    image: activity.image,
    confirmationCode: activity.confirmationCode,
    participantCount: activity.participants.length,
    address: activity.activeAddress
      ? {
          latitude: activity.activeAddress.latitude,
          longitude: activity.activeAddress.longitude,
        }
      : null,
    scheduledDate: activity.scheduledDate,
    createdAt: activity.createdAt,
    completedAt: activity.completedAt,
    private: activity.private,
    creator: {
      id: activity.creator.id,
      name: activity.creator.name,
      avatar: activity.creator.avatar,
    },
  }));
};

export const userRepository = {
  getById: async (id: string) => {
    return await prisma.user.findUnique({
      where: {
        id,
      },
    });
  },
};

export const activityRepository = {
  getActivitiesByParticipant: async (userId: string) => {
    return await prisma.activity.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        deletedAt: null,
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
  },
};

export const getParticipantsByActivity = async (activityId: string) => {
  const participants = await prisma.activityParticipant.findMany({
    where: { activityId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return participants.map((participant) => ({
    id: participant.user.id,
    userId: participant.user.id,
    name: participant.user.name,
    avatar: participant.user.avatar,
    subscriptionStatus: "string",
    confirmedAt: new Date().toISOString(),
  }));
};

export const ActivityRepository = {
  async getActivitiesCreatedByUserId(userId: string) {
    return await prisma.activity.findMany({
      where: {
        creatorId: userId,
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
  },
};

export const getActivitiesCreatedByUserIdPaginated = async (
  userId: string,
  page: number,
  pageSize: number
) => {
  const skip = (page - 1) * pageSize;

  const result = await prisma.activity.findMany({
    where: { creatorId: userId },
    skip,
    take: pageSize,
    include: {
      creator: true,
    },
  });

  const totalActivities = await prisma.activity.count({
    where: { creatorId: userId },
  });

  const totalPages = Math.ceil(totalActivities / pageSize);

  return {
    activities: result,
    totalActivities,
    totalPages,
  };
};

export const getAllActivities = async (
  typeId: string | undefined,
  page: number,
  pageSize: number,
  orderBy: string,
  order: string
) => {
  const orderConfig: { [key: string]: "asc" | "desc" } = {};

  if (orderBy) {
    orderConfig[orderBy] = order === "desc" ? "desc" : "asc";
  } else {
    orderConfig["createdAt"] = "desc";
  }

  return await prisma.activity.findMany({
    where: {
      typeId: typeId ? typeId : undefined,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: orderConfig,
    include: {
      creator: true,
    },
  });
};

export const countActivities = async (typeId: string | undefined) => {
  return await prisma.activity.count({
    where: {
      typeId: typeId ? typeId : undefined,
    },
  });
};

export const getAllActivitiesPrin = async (
  typeId: string | undefined,
  page: number,
  pageSize: number,
  orderBy: string,
  order: string
) => {
  const orderConfig: { [key: string]: "asc" | "desc" } = {};

  if (orderBy) {
    orderConfig[orderBy] = order === "desc" ? "desc" : "asc";
  } else {
    orderConfig["createdAt"] = "desc";
  }

  return await prisma.activity.findMany({
    where: {
      typeId: typeId ? typeId : undefined,
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: orderConfig,
    include: {
      creator: true,
    },
  });
};

export const countActivitiesPrin = async (typeId: string | undefined) => {
  return await prisma.activity.count({
    where: {
      typeId: typeId ? typeId : undefined,
    },
  });
};

export async function confirmPresence(activityId: string, userId: string) {
  const now = new Date();

  // Verifica se o usuário está inscrito na atividade
  const participation = await prisma.activityParticipant.findUnique({
    where: {
      activityId_userId: {
        activityId,
        userId,
      },
    },
    include: {
      activity: {
        select: {
          creatorId: true,
        },
      },
    },
  });

  if (!participation) {
    throw new Error("Usuário não está inscrito nesta atividade");
  }

  if (participation.confirmedAt) {
    throw new Error("Presença já confirmada nesta atividade");
  }

  // Atualiza a participação com a data de confirmação
  const confirmedParticipation = await prisma.activityParticipant.update({
    where: {
      activityId_userId: {
        activityId,
        userId,
      },
    },
    data: {
      confirmedAt: now,
    },
    include: {
      activity: {
        select: {
          creatorId: true,
        },
      },
    },
  });

  return {
    participation: confirmedParticipation,
    creatorId: confirmedParticipation.activity.creatorId,
  };
}

export async function completeActivity(activityId: string, creatorId: string) {
  // Verifica se o usuário é o criador da atividade
  const activity = await prisma.activity.findFirst({
    where: {
      id: activityId,
      creatorId: creatorId,
    },
  });

  if (!activity) {
    throw new Error("Atividade não encontrada ou usuário não é o criador");
  }

  // Atualiza a atividade como concluída
  return await prisma.activity.update({
    where: {
      id: activityId,
    },
    data: {
      completedAt: new Date(),
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
}
