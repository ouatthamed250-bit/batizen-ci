type CloudinaryUploadResponse = {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
};

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

function assertCloudinaryConfig(): void {
  if (!UPLOAD_PRESET) {
    throw new Error(
      "[Cloudinary] Upload preset manquant. Définissez NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET dans .env.local"
    );
  }
  if (!CLOUD_NAME) {
    throw new Error(
      "[Cloudinary] Cloud name manquant. Définissez NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME dans .env.local"
    );
  }
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("connection");
  }
  return false;
}

export const uploadToCloudinary = async (file: File): Promise<string> => {
  assertCloudinaryConfig();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET!);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload du fichier sur Cloudinary");
      }

      const data: CloudinaryUploadResponse = await response.json();
      return data.secure_url;
    } catch (err: unknown) {
      const isNetwork = isNetworkError(err);
      if (isNetwork && attempt < MAX_RETRIES) {
        continue;
      }
      throw new Error("Problème de connexion. Veuillez réessayer.");
    }
  }

  throw new Error("Problème de connexion. Veuillez réessayer.");
};