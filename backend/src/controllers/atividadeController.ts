// src/controllers/atividadeController.ts
import { Express, Router, Request, Response } from "express";
import {
  approveParticipationService,
  cancelParticipationService,
  checkInActivityService,
  concludeActivityService,
  // concludeActivityService,
  createActivityService,
  deleteActivityService,
  getActivitiesByParticipant,
  getActivitiesByUserId,
  getActivitiesCreatedByUserId,
  getAllActivitiesServicePrin,
  subscribeToActivity,
  updateActivity,
} from "../services/atividadeService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import {
  ActivityRepository,
  countActivities,
  getActivitiesCreatedByUserIdPaginated,
  getAllActivities,
  getAllTypes,
  getParticipantsByActivity,
} from "../repository/atividade-repository";
import authGuard from "../middlewares/authentication";
import { generateConfirmationCode } from "../utils/generateConfirmationCode";
import * as activityService from "../services/activityService";

const router = Router();

const atividadeController = (server: Express) => {
  server.use("/atividades", router);

  router.post("/types", authGuard, async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        typeId,
        scheduledDate,
        image,
        private: privateActivity,
        creatorId,
        latitude,
        longitude,
      } = req.body;

      if (req.userId !== creatorId) {
        res
          .status(403)
          .json({ error: "Você não tem permissão para criar esta atividade." });
        return;
      }

      if (
        !title ||
        !description ||
        !typeId ||
        !scheduledDate ||
        !creatorId ||
        latitude === undefined ||
        longitude === undefined
      ) {
        res.status(400).json({
          error: "Todos os campos obrigatórios devem ser preenchidos.",
        });
        return;
      }

      const isPrivate =
        typeof privateActivity === "boolean" ? privateActivity : false;

      // Chama o serviço atualizado para criar a atividade, conceder XP e conquistas
      const newActivity = await activityService.createActivity({
        title,
        description,
        typeId,
        scheduledDate: new Date(scheduledDate),
        image: image || "",
        privateActivity: isPrivate,
        completedAt: new Date(),
        creatorId,
        latitude,
        longitude,
        confirmationCode: generateConfirmationCode(),
      });

      res.status(201).json(newActivity);
      return;
    } catch (error) {
      console.error("Erro ao criar a atividade:", error);
      res.status(500).json({
        error: "Ocorreu um erro ao criar a atividade.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      });
      return;
    }
  });

  router.get("/types", authGuard, async (req: Request, res: Response) => {
    try {
      const types = await getAllTypes();

      res.status(200).json(types);
    } catch (error) {
      res.status(500).send("Erro ao buscar os tipos");
    }
  });

  router.put("/:id", authGuard, async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
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
    } = req.body;

    try {
      const updatedActivity = await updateActivity({
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
      });
      res.status(200).json(updatedActivity);
      return;
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar a atividade" });
      return;
    }
  });

  router.delete("/:id", authGuard, async (req: Request, res: Response) => {
    try {
      const activityId = req.params.id;

      // Chama o serviço de exclusão da atividade
      await deleteActivityService(activityId);

      res.status(200).json({ message: "Atividade excluída com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir a atividade" });
    }
  });

  router.post(
    "/:id/subscribe",
    authGuard,
    async (req: Request, res: Response) => {
      const { id: activityId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ message: "ID do usuário é obrigatório" });
        return;
      }

      try {
        const subscription = await subscribeToActivity(userId, activityId);
        res.status(201).json({
          message: "Inscrição realizada com sucesso",
          subscription,
        });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  router.delete(
    "/:id/unsubscribe",
    authGuard,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const userId = req.userId;

        if (!userId) {
          res.status(400).json({
            error: "User ID is required to unsubscribe",
          });
          return;
        }

        const result = await cancelParticipationService(id, userId);

        if (result) {
          res.status(200).json({
            message: "Participação cancelada com sucesso.",
          });
        } else {
          res.status(404).json({
            error: "Participação não encontrada ou não existe.",
          });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }
  );

  router.put(
    "/:id/conclude",
    authGuard,
    async (req: Request, res: Response) => {
      if (!req.userId) {
        res.status(403).json({ error: "Usuário não autenticado." });
        return;
      }

      const user = req.userId;
      const atividadeId = req.params.id;

      try {
        await concludeActivityService(atividadeId, user);
        res.json({ message: "Atividade concluída com sucesso" });
      } catch (error) {
        console.error("Erro ao concluir atividade:", error);
        res.status(500).json({ error: "Erro ao concluir a atividade." });
      }
    }
  );

  router.get(
    "/participant/all",
    authGuard,
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId;

        if (!userId) {
          res.status(401).json({ message: "Usuário não autenticado" });
          return;
        }

        const activities = await getActivitiesByParticipant(userId);

        if (!activities || activities.length === 0) {
          res
            .status(404)
            .json({ message: "Nenhuma atividade encontrada para o usuário" });
          return;
        }

        res.status(200).json(activities);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Erro ao buscar as atividades do usuário" });
      }
    }
  );

  router.get(
    "/:id/participants",
    authGuard,
    async (req: Request, res: Response) => {
      try {
        const activityId = req.params.id;

        if (!activityId) {
          res.status(400).json({ message: "ID da atividade é obrigatório" });
          return;
        }

        const participants = await getParticipantsByActivity(activityId);

        if (!participants || participants.length === 0) {
          res.status(404).json({ message: "Nenhum participante encontrado" });
          return;
        }

        res.status(200).json(participants);
      } catch (error) {
        console.error("Erro ao buscar participantes da atividade:", error);
        res.status(500).json({ error: "Erro ao buscar participantes" });
      }
    }
  );

  router.get(
    "/user/participant",
    authGuard,
    async (req: Request, res: Response) => {
      const userId: string | undefined = req.userId;

      if (!userId) {
        res.status(400).json({ error: "Usuário não autenticado." });
        return;
      }

      try {
        const { activities, totalActivities, totalPages } =
          await getActivitiesByUserId(
            userId,
            Number(req.query.page) || 1,
            Number(req.query.pageSize) || 10
          );

        res.status(200).json({
          activities,
          totalActivities,
          totalPages,
        });
      } catch (error) {
        console.error("Erro ao buscar atividades do usuário:", error);
        res.status(500).json({ error: "Erro ao buscar atividades." });
      }
    }
  );

  router.get(
    "/user/creator/all",
    authGuard,
    async (req: Request, res: Response) => {
      const userId: string | undefined = req.userId;

      if (!userId) {
        res.status(400).json({ error: "Usuário não autenticado." });
        return;
      }

      try {
        const activities =
          await ActivityRepository.getActivitiesCreatedByUserId(userId);
        res.json(activities);
      } catch (error) {
        res.status(500).json({ error: "Erro ao buscar atividades." });
      }
    }
  );

  router.get(
    "/user/creator",
    authGuard,
    async (req: Request, res: Response) => {
      const userId: string | undefined = req.userId;

      if (!userId) {
        res.status(400).json({ error: "Usuário não autenticado." });
        return;
      }

      const page: number = parseInt(req.query.page as string) || 1;
      const pageSize: number = parseInt(req.query.pageSize as string) || 10;

      try {
        const { activities, totalActivities, totalPages } =
          await getActivitiesCreatedByUserIdPaginated(userId, page, pageSize);

        res.json({
          page,
          pageSize,
          totalActivities,
          totalPages,
          activities,
        });
      } catch (error) {
        res.status(500).json({ error: "Erro ao buscar atividades." });
      }
    }
  );

  router.get("/all", authGuard, async (req: Request, res: Response) => {
    const { typeId, orderBy, order } = req.query;

    try {
      // Buscar todos sem paginação
      const activities = await prisma.activity.findMany({
        where: {
          typeId: typeId ? (typeId as string) : undefined,
          deletedAt: null,
        },
        orderBy: {
          [(orderBy as string) || "createdAt"]:
            order === "desc" ? "desc" : "asc",
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
          type: true,
        },
      });

      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar todas as atividades." });
    }
  });

  router.get("/", authGuard, async (req: Request, res: Response) => {
    const { typeId, orderBy, order } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    try {
      const result = await getAllActivitiesServicePrin(
        typeId as string,
        page,
        pageSize,
        orderBy as string,
        order as string
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar atividades." });
    }
  });

  router.put(
    "/:id/check-in",
    authGuard,
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const { confirmationCode } = req.body;
      const userId = req.userId;

      try {
        if (!userId) {
          res.status(400).json({ error: "Usuário não autenticado." });
          return;
        }

        await checkInActivityService(id, confirmationCode, userId);

        res
          .status(200)
          .json({ message: "Participação confirmada com sucesso." });
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }
  );

  router.put("/:id/approve", authGuard, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { participantId, approved } = req.body;

    const userId = req.userId;

    if (!userId) {
      res.status(400).json({ error: "Usuário não autenticado." });
      return;
    }

    try {
      const result = await approveParticipationService(
        id,
        participantId,
        approved,
        userId
      );

      res.status(200).json({
        message: `Solicitação de participação ${
          approved ? "aprovada" : "negada"
        } com sucesso.`,
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // Adicionar endpoint para confirmar presença em uma atividade
  router.post(
    "/:id/confirm-presence",
    authGuard,
    async (req: Request, res: Response) => {
      try {
        const activityId = req.params.id;
        const userId = req.userId;

        if (!userId) {
          res.status(401).json({ message: "Usuário não autenticado" });
          return;
        }

        // Chama o serviço para confirmar presença, conceder XP e conquistas
        const confirmedParticipation = await activityService.confirmPresence(
          activityId,
          userId
        );

        res.status(200).json({
          message: "Presença confirmada com sucesso",
          participation: confirmedParticipation,
        });
      } catch (error: any) {
        console.error("Erro ao confirmar presença:", error);
        res.status(400).json({
          message: error.message || "Erro ao confirmar presença",
        });
      }
    }
  );

  // Adicionar endpoint para concluir uma atividade
  router.post(
    "/:id/complete",
    authGuard,
    async (req: Request, res: Response) => {
      try {
        const activityId = req.params.id;
        const creatorId = req.userId;

        if (!creatorId) {
          res.status(401).json({ message: "Usuário não autenticado" });
          return;
        }

        // Chama o serviço para completar a atividade, conceder XP e conquistas
        const completedActivity = await activityService.completeActivity(
          activityId,
          creatorId
        );

        res.status(200).json({
          message: "Atividade concluída com sucesso",
          activity: completedActivity,
        });
      } catch (error: any) {
        console.error("Erro ao concluir atividade:", error);
        res.status(400).json({
          message: error.message || "Erro ao concluir atividade",
        });
      }
    }
  );
};

export default atividadeController;
