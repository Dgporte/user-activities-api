import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export default function validateRequestBodyUser(schema: ZodSchema) {
  return function (req: Request, res: Response, next: NextFunction) {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).send("Informe os campos obrigatórios corretamente.");
    }
  };
}
