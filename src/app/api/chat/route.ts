import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

// 🔒 Rate limiting : 5 messages/jour par IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS) return false;
  record.count++;
  return true;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  // Rate limiting par IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Quota dépassé. Vous pouvez envoyer 5 messages par jour.", limit: true },
      { status: 429 }
    );
  }

  let message = '';
  let history: any[] = [];
  try {
    const body = await request.json();
    message = body.message || '';
    history = body.history || [];

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `Tu es l'assistant virtuel de BATIZEN.CI, une entreprise de BTP en Côte d'Ivoire.

      Tu réponds aux questions sur :
      - Les matériaux de construction (ciment, sable, acier, briques, etc.)
      - Les services de rénovation
      - Les prix en FCFA
      - La prise de rendez-vous
      - Le suivi de chantier
      - Les informations générales sur BATIZEN.CI

      RÈGLES :
      - Tu es poli, professionnel et concis
      - Tu donnes toujours les prix en FCFA
      - Tu parles en français
      - Si on te demande quelque chose en dehors du BTP, redirige vers les services BATIZEN
      - Si tu ne sais pas, dis : "Je vous invite à contacter notre équipe au +225 0749883981"
      - Réponds en maximum 3-4 phrases
      - Utilise des emojis BTP quand c'est approprié (🏗️ 🧱 🔨 🏠)`
    });

    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      reply: text,
      history: [
        ...(history || []),
        { role: 'user', parts: [{ text: message }] },
        { role: 'model', parts: [{ text: text }] }
      ]
    });
  } catch (error) {
    console.error('Erreur Gemini:', error);
    const fallback = getFaqAnswer(message);
    if (fallback) {
      return NextResponse.json({ success: true, reply: fallback, fallback: true });
    }
    return NextResponse.json({
      success: true,
      reply: "🏗️ Je suis l'assistant BATIZEN CI. Pour une réponse précise, contactez notre équipe au +225 0749883981 (WhatsApp/Appel) — nos conseillers BTP vous répondront sous 24h. 💡 Astuce : demandez-moi le prix du ciment, nos services, la prise de rendez-vous ou l'emplacement de nos dépôts !",
    });
  }
}

const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["prix", "ciment", "combien", "cout", "fcfa", "sac"],
    answer: "🧱 Le ciment CPJ 35 est à 4 500 FCFA le sac de 50kg. Le CPJ 45 est à 5 000 FCFA. Souhaitez-vous passer commande ?",
  },
  {
    keywords: ["service", "propose", "offre", "renovation", "construction"],
    answer: "🏗️ BATIZEN CI propose : construction de maisons, rénovation complète, gestion de chantier, suivi de travaux et devis gratuit. Tout est sous engagement qualité.",
  },
  {
    keywords: ["rendez", "rdv", "contact", "visite", "rencontrer"],
    answer: "📅 Vous pouvez demander une visite technique depuis notre menu 'Rénovation' ou 'Nouveau chantier'. La visite coûte 100 000 FCFA (déductible du devis final). Notre expert viendra sous 24-48h. Sinon contactez-nous au +225 0749883981.",
  },
  {
    keywords: ["depot", "boutique", "magasin", "yamoussoukro", "abidjan", "stock"],
    answer: "🏠 Nos dépôts BATIZEN se trouvent à Abidjan, Yamoussoukro et bientôt dans plusieurs villes de Côte d'Ivoire. Consultez l'onglet 'Matériaux' pour les stocks.",
  },
  {
    keywords: ["chantier", "suivi", "avancement", "projet"],
    answer: "📊 Le suivi de chantier se fait dans l'onglet 'Mes chantiers' : avancement, photos, et paiements débloqués uniquement après validation qualité. Votre argent est protégé.",
  },
];

function getFaqAnswer(message: string): string | null {
  const m = (message || "").toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some((k) => m.includes(k))) return item.answer;
  }
  return null;
}