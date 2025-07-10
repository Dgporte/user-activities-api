import { Express, Router, Request, Response } from "express";
import {
  getById,
  getUserPreferences,
  getUserWithAchievements,
  softDelete,
  update,
} from "../repository/user-repository";
import {
  definePreference,
  updateUsersAvatarService,
} from "../services/userService";
import authGuard from "../middlewares/authentication";
import upload from "../multer/multer";
import { uploadImage } from "../services/s3-config";
import prisma from "../prisma/prisma-client";

const router = Router();

const userController = (server: Express) => {
  server.use("/users", router);

  router.get("/:id", authGuard, async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const user = await getUserWithAchievements(id);

      if (!user) {
        res.status(404).send("Usuário não encontrado");
        return;
      }

      const formattedAchievements = user.achievements.map(
        (userAchievement) => ({
          id: userAchievement.achievement.id,
          name: userAchievement.achievement.name,
          criterion: userAchievement.achievement.criterion,
        })
      );

      res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        achievements: formattedAchievements,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).send("Erro ao buscar usuário");
    }
  });

  router.put("/:id", authGuard, async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    try {
      const updatedUser = await update(data, id);

      if (!updatedUser) {
        res.status(404).json({ message: "Usuário não encontrado" });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao atualizar o usuário" });
    }
  });

  router.delete("/:id", authGuard, async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const user = await softDelete(id);

      if (!user) {
        res.status(404).send("Usuário não encontrado");
        return;
      }

      res.status(200).send("Usuário marcado como deletado com sucesso");
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao deletar usuário");
    }
  });

  router.get(
    "/:id/preferences",
    authGuard,
    async (req: Request, res: Response) => {
      const { id } = req.params;

      try {
        if (!id) {
          res.status(400).json({ error: "ID do usuário não fornecido" });
          return;
        }

        const preferences = await getUserPreferences(id);

        if (!preferences || preferences.length === 0) {
          res.status(404).json({ message: "Nenhuma preferência encontrada" });
          return;
        }

        res.status(200).json(preferences);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Erro ao buscar preferências do usuário" });
      }
    }
  );

  router.put(
    "/avatar",
    authGuard,
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const userId = req.userId;

        if (!userId) {
          res.status(401).json({ message: "Usuário não autenticado" });
          return;
        }

        let imagePath;

        if (req.file) {
          imagePath = await uploadImage(req.file);
        } else if (req.body.avatar) {
          imagePath = req.body.avatar;
        } else {
          res.status(400).json({ message: "Avatar é obrigatório" });
          return;
        }

        try {
          const updatedUser = await updateUsersAvatarService(imagePath, userId);

          res.status(200).json({
            message: "Foto de perfil atualizada com sucesso",
            avatar: updatedUser.avatar,
          });
        } catch (error: any) {
          if (error.status === 404) {
            res.status(404).json({ message: error.message });
          } else {
            console.error("Erro ao atualizar avatar:", error);
            res.status(500).json({ message: "Erro interno do servidor" });
          }
        }
      } catch (error) {
        console.error("Erro:", error);
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  );
};

export default userController;
