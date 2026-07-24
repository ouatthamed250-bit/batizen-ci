export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'batizen_upload');

  // CHANGEMENT ICI : /auto/upload au lieu de /image/upload pour accepter audio, pdf, etc.
  const url = 'https://api.cloudinary.com/v1_1/f4iwk8g6/auto/upload';

  // 🔄 Retry 2 fois en cas d'erreur réseau (ERR_CONNECTION_RESET, Failed to fetch, etc.)
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Cloudinary: tentative ${attempt + 1}/${MAX_RETRIES + 1}...`);
        // Délai progressif : 1s puis 2s
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur Cloudinary:', errorText);
        throw new Error("Erreur lors de l'upload du fichier sur Cloudinary");
      }

      const data = await response.json();
      return data.secure_url; // URL HTTPS du fichier (image, audio, pdf, etc.)
    } catch (err: any) {
      lastError = err;

      // Si c'est une erreur réseau (Failed to fetch, ERR_CONNECTION_RESET), on retente
      const isNetworkError = err?.message === 'Failed to fetch'
        || err?.name === 'TypeError'
        || err?.message?.includes('Failed to fetch')
        || err?.message?.includes('NetworkError')
        || err?.message?.includes('network')
        || err?.message?.includes('Connection');

      if (isNetworkError && attempt < MAX_RETRIES) {
        console.warn(`⚠️ Cloudinary: erreur réseau (tentative ${attempt + 1}/${MAX_RETRIES + 1})`, err.message);
        continue; // Retenter
      }

      // Si ce n'est pas une erreur réseau ou qu'on a épuisé les tentatives, on stoppe
      console.error('❌ Cloudinary: échec final après', attempt + 1, 'tentative(s):', err.message);
      throw new Error("Problème de connexion. Veuillez réessayer.");
    }
  }

  // Ne devrait jamais arriver, mais garde-fou
  throw new Error("Problème de connexion. Veuillez réessayer.");
};