import { ref, push } from "firebase/database";
import { getFirebaseServices } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function saveGeneratedDocument(
  pdfBlob: Blob,
  opts: { chantierId: string; nom: string; type: "devis" | "facture" | "plan" | "autre"; creePar?: string }
): Promise<string> {
  const file = new File([pdfBlob], opts.nom, { type: "application/pdf" });
  const url = await uploadToCloudinary(file);
  const { database } = getFirebaseServices();
  await push(ref(database, "documents"), {
    chantierId: opts.chantierId,
    nom: opts.nom,
    type: opts.type,
    url,
    taille: pdfBlob.size,
    dateUpload: Date.now(),
    creePar: opts.creePar || "system",
    actif: true,
  });
  return url;
}