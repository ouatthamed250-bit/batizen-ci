export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'batizen_upload');

  const response = await fetch(
    'https://api.cloudinary.com/v1_1/f4iwk8g6/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erreur Cloudinary:', errorText);
    throw new Error("Erreur lors de l'upload de l'image sur Cloudinary");
  }

  const data = await response.json();
  return data.secure_url; // URL HTTPS de l'image
};