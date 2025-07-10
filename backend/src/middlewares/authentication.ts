
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET!;

export default function authGuard(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    response
      .status(401)
      .send("Você precisa estar autenticado para acessar este endpoint.");
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const user = jwt.verify(token, jwtSecret) as {
      id: string;
      name: string;
      email: string;
      password: string;
      iat: number;
      exp: number;
    };

    request.userId = user.id; 
    next(); 
  } catch (error: any) {
    response.status(401).send("Token inválido ou expirado.");
    return;
  }
}
