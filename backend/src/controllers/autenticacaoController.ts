import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { create, login } from "../repository/autenticacao-repository"; // Seus métodos para criar e fazer login

import dotenv from "dotenv";
import { createUserService } from "../services/autetucacaoService";
dotenv.config();


const jwtSecret = process.env.JWT_SECRET!;

const router = Router();

const autenticacaoController = (server: any) => {
  server.use("/auth", router);



  router.post("/register", async (req: Request, res: Response) => {
    const { name, email, password, cpf } = req.body;
  
    try {
      const user = await createUserService({ name, email, password, cpf });
  
      res.status(201).json({ user });
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).send("Erro ao criar usuário");
    }
  });


  router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    
    const user = await login(email, password);

    if (!user) {
      res.status(401).json({ message: "Credenciais inválidas" });
      return;
    }

    
    console.log("user.id:", user.id);
    console.log("jwtSecret:", jwtSecret);

  
    const token = jwt.sign({ id: String(user.id) }, jwtSecret, {
      expiresIn: "1h",
    });

    
    console.log("Generated token:", token);

    
    res.status(200).json({ user, token });
  });
};

export default autenticacaoController;
