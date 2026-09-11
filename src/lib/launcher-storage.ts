import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

const bucket = process.env.AWS_S3_BUCKET_NAME ?? process.env.BUCKET;
const endpoint = process.env.AWS_ENDPOINT_URL ?? process.env.S3_ENDPOINT;
const region = process.env.AWS_DEFAULT_REGION ?? process.env.AWS_REGION ?? "auto";

function storageClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Railway Object Storage não está configurado.");
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: false,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export const LAUNCHER_CLIENT_KEY = "launcher/client/latest.zip";

export async function uploadClientObject(body: Readable, contentLength?: number) {
  const client = storageClient();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: LAUNCHER_CLIENT_KEY,
    ContentType: "application/zip",
    CacheControl: "no-cache",
    ...(contentLength != null ? { ContentLength: contentLength } : {}),
    Body: body,
  }));
}

export async function getClientObject() {
  return storageClient().send(new GetObjectCommand({ Bucket: bucket, Key: LAUNCHER_CLIENT_KEY }));
}
