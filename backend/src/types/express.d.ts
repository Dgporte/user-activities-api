import { Request } from "express";
import "./types/express";

declare global {
  namespace Express {
    interface Request {
      userId?: string; // Adiciona a propriedade `userId` ao tipo Request
    }
  }
}
