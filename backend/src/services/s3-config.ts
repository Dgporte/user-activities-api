import {
  CreateBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const bucketName = process.env.BUCKET_NAME!;

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function createBucket() {
  await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
  console.log("Bucket criado com sucesso.");
}

export async function uploadImage(file: Express.Multer.File) {
  const fileExtension = file.originalname.split(".").pop() || "png";
  const uniqueFileName = `avatar-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 15)}.${fileExtension}`;

  const uploadParams = {
    Bucket: bucketName,
    Key: uniqueFileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return `${process.env.S3_ENDPOINT}/${bucketName}/${uniqueFileName}`;
}

export { s3, bucketName };
