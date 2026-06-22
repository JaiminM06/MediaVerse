import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export const getPresignedUploadUrl = async (key, contentType, expiresInSeconds = 300) => {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_RAW_BUCKET,
        Key: key,
        ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expiresInSeconds,
    });

    return { uploadUrl, key };
};

export const deleteS3Object = async (bucket, key) => {
    const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    });
    return await s3Client.send(command);
};

export const getCloudFrontUrl = (key) => {
    if (process.env.CLOUDFRONT_DOMAIN && process.env.CLOUDFRONT_DOMAIN.trim() !== "") {
        return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
    }
    const region = process.env.AWS_REGION || "ap-south-1";
    return `https://${process.env.AWS_S3_PROCESSED_BUCKET}.s3.${region}.amazonaws.com/${key}`;
};
