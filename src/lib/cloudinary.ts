export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'batizen_upload');

  // CHANGEMENT ICI : /auto/upload au lieu de /image/upload pour accepter audio, pdf, etc.
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/f4iwk8g6/auto/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erreur Cloudinary:', errorText);
    throw new Error("Erreur lors de l'upload du fichier sur Cloudinary");
  }

  const data = await response.json();
  return data.secure_url; // URL HTTPS du fichier (image, audio, pdf, etc.)
};