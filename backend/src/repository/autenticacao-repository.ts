import prisma from "../prisma/prisma-client";
import userData from "../types/user.data";
import bcrypt from "bcrypt";

export const create = async ({
  name,
  email,
  password,
  cpf,
  avatar,
}: {
  name: string;
  email: string;
  password: string;
  cpf: string;
  avatar: string;
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      cpf,
      avatar,
      xp: 0,
      level: 1,
    },
  });
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email } as any,
  });

  if (!user) return null;

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return null;

  return user;
};
