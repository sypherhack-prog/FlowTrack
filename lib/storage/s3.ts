// lib/storage/s3.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'eu-west-1';
const ENDPOINT = process.env.S3_ENDPOINT;

export const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT || undefined,
  forcePathStyle: Boolean(ENDPOINT),
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export async function uploadScreenshotToS3(file: File, keyPrefix: string): Promise<string> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error('S3_BUCKET_NAME is not set');
  }

  const arrayBuffer = await file.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  const key = `${keyPrefix}-${Date.now()}.webp`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'image/webp',
      ACL: 'public-read',
    }),
  );

  const publicBase = process.env.S3_PUBLIC_URL;

  if (publicBase) {
    const base = publicBase.replace(/\/$/, '');
    return `${base}/${bucket}/${key}`;
  }

  if (ENDPOINT) {
    let base = ENDPOINT.replace(/\/$/, '');

    // Dans l'environnement Docker local, le service MinIO est joignable en
    // http://minio:9000 depuis le conteneur, mais depuis le navigateur il faut
    // passer par http://localhost:9000. Si aucun S3_PUBLIC_URL n'est défini,
    // on réécrit donc l'URL publique pour utiliser localhost.
    if (base.includes('://minio')) {
      base = base.replace('://minio', '://localhost');
    }

    return `${base}/${bucket}/${key}`;
  }

  const url = `https://${bucket}.s3.${REGION}.amazonaws.com/${key}`;
  return url;
}
