import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export default function validateRequestBody(schema: ZodSchema) {
  return function requestBodyValidator(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      schema.parse(request.body);
      next();
    } catch (error: any) {
      response.status(400).send("Informe os campos obrigatórios corretamente.");
    }
  };
}
