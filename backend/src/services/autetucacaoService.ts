import { create } from "../repository/autenticacao-repository";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import userData from "../types/user.data";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localstack:4566",
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
  forcePathStyle: true,
});

interface UserData {
  name: string;
  email: string;
  password: string;
  cpf: string;
}

export async function createUserService(userData: UserData) {
  try {
    const defaultAvatarPath = path.join(
      __dirname,
      "../assets/default-avatar.png"
    );
    const bucketName = process.env.BUCKET_NAME || "diogo";
    const avatarKey = `default-avatar-${Date.now()}.png`;

    try {
      const fileContent = fs.readFileSync(defaultAvatarPath);

      const uploadParams = {
        Bucket: bucketName,
        Key: avatarKey,
        Body: fileContent,
        ContentType: "image/png",
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      const avatarUrl = `${process.env.S3_ENDPOINT}/${bucketName}/${avatarKey}`;

      const user = await create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        cpf: userData.cpf,
        avatar: avatarUrl,
      });

      return user;
    } catch (s3Error) {
      console.error("Erro ao fazer upload do avatar padrão:", s3Error);

      const fallbackAvatarUrl = `${process.env.S3_ENDPOINT}/${bucketName}/default-avatar.png`;

      const user = await create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        cpf: userData.cpf,
        avatar: fallbackAvatarUrl,
      });

      return user;
    }
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
}
