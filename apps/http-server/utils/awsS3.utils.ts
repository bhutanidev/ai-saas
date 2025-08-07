// utils/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({ 
    region: "ap-south-1",
    credentials:{
        accessKeyId:process.env.ACCESS_KEY!,
        secretAccessKey:process.env.SECRET_KEY!
    }
 });

export const getPresignedUploadUrl = async ({
  key,
  contentType
}: {
  key: string;
  contentType: string;
}) => {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 mins
  return url;
};
