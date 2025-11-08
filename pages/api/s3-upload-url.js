import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { filename, type } = req.body;

    if (!filename || !type) {
      return res.status(400).json({ success: false, error: "Missing filename or type" });
    }

    const uniqueFilename = `${Date.now()}-${filename}`;

    // --- THIS IS THE FIX ---
    // We REMOVE the ContentType from the command.
    // This creates a URL that lets the client set the ContentType.
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueFilename,
      // ContentType: type, // <-- THIS LINE IS REMOVED
    });
    // --- END OF FIX ---

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    res.status(200).json({
      success: true,
      uploadUrl: uploadUrl,
      imageUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${uniqueFilename}`
    });

  } catch (error) {
    console.error("Error in s3-upload-url API:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}