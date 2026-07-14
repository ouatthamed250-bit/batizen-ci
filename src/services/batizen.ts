import { db } from "@/db";
import { batizenMaterials, batizenMessages, batizenProjects, batizenQuotes } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export type DashboardData = {
  projectCount: number;
  quoteCount: number;
  unreadMessages: number;
  totalBudgetFcfa: number;
  averageProgress: number;
};

let initialized = false;

export async function ensureBatizenDatabase(): Promise<void> {
  if (initialized || !db) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS batizen_users (
      id SERIAL PRIMARY KEY,
      external_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      city TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS batizen_projects (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      city TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      image_url TEXT NOT NULL,
      budget_fcfa INTEGER NOT NULL,
      surface_m2 INTEGER NOT NULL,
      rooms INTEGER NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      is_shared BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS batizen_quotes (
      id SERIAL PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      project_slug TEXT NOT NULL,
      label TEXT NOT NULL,
      amount_fcfa INTEGER NOT NULL,
      status TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS batizen_messages (
      id SERIAL PRIMARY KEY,
      sender TEXT NOT NULL,
      subject TEXT NOT NULL,
      preview TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'app',
      unread BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS batizen_materials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      average_price_fcfa INTEGER NOT NULL,
      city TEXT NOT NULL
    )
  `);

  await seedBatizenDatabase();
  initialized = true;
}

async function seedBatizenDatabase(): Promise<void> {
  if (!db) return;

  await db.execute(sql`
    INSERT INTO batizen_users (external_id, full_name, email, phone, city, role)
    VALUES ('demo-client', 'Awa Koné', 'awa.kone@batizen.ci', '+2250700000000', 'Abidjan', 'client')
    ON CONFLICT (external_id) DO NOTHING
  `);

  await db.execute(sql`
    INSERT INTO batizen_projects (slug, title, city, type, status, image_url, budget_fcfa, surface_m2, rooms, progress, is_shared)
    VALUES
      ('villa-riviera-signature', 'Villa Riviera Signature', 'Abidjan', 'Villa moderne', 'Chantier', '/assets/images/project-villa-abidjan.jpg', 78500000, 180, 5, 64, true),
      ('duplex-yamoussoukro', 'Duplex Familial Prestige', 'Yamoussoukro', 'Duplex', 'Devis', '/assets/images/project-duplex-yamoussoukro.jpg', 96500000, 240, 6, 28, false)
    ON CONFLICT (slug) DO NOTHING
  `);

  await db.execute(sql`
    INSERT INTO batizen_quotes (reference, project_slug, label, amount_fcfa, status, valid_until)
    VALUES
      ('BCI-DEV-2026-001', 'villa-riviera-signature', 'Gros œuvre + toiture terrasse', 31200000, 'Validé', '2026-03-30'),
      ('BCI-DEV-2026-002', 'duplex-yamoussoukro', 'Finition premium complète', 42800000, 'En attente', '2026-04-15')
    ON CONFLICT (reference) DO NOTHING
  `);

  await db.execute(sql`
    INSERT INTO batizen_messages (sender, subject, preview, channel, unread)
    VALUES
      ('Chef chantier', 'Avancement fondations', 'Les longrines sont terminées et prêtes pour validation.', 'app', true),
      ('Support BÂTIZEN', 'Contrat sécurisé', 'Votre contrat numérique est prêt pour signature.', 'google', true),
      ('Assistant IA', 'Optimisation budget', 'Une économie estimée de 6% est possible sur les finitions.', 'app', false)
    ON CONFLICT DO NOTHING
  `);

  await db.execute(sql`
    INSERT INTO batizen_materials (name, category, unit, average_price_fcfa, city)
    VALUES
      ('Ciment CPJ 42.5', 'Gros œuvre', 'sac', 5200, 'Abidjan'),
      ('Fer à béton HA12', 'Structure', 'barre', 4200, 'Abidjan'),
      ('Carrelage premium', 'Finition', 'm²', 12500, 'Abidjan')
    ON CONFLICT (name) DO NOTHING
  `);
}

function emptyDashboardData(): DashboardData {
  return {
    projectCount: 0,
    quoteCount: 0,
    unreadMessages: 0,
    totalBudgetFcfa: 0,
    averageProgress: 0,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!db) {
    return emptyDashboardData();
  }

  await ensureBatizenDatabase();
  const [projectRow] = await db.select({ count: sql<number>`count(*)::int` }).from(batizenProjects);
  const [quoteRow] = await db.select({ count: sql<number>`count(*)::int` }).from(batizenQuotes);
  const [messageRow] = await db.select({ count: sql<number>`count(*)::int` }).from(batizenMessages).where(sql`${batizenMessages.unread} = true`);
  const [budgetRow] = await db.select({ total: sql<number>`coalesce(sum(${batizenProjects.budgetFcfa}), 0)::int` }).from(batizenProjects);
  const [progressRow] = await db.select({ average: sql<number>`coalesce(avg(${batizenProjects.progress}), 0)::int` }).from(batizenProjects);

  return {
    projectCount: projectRow?.count ?? 0,
    quoteCount: quoteRow?.count ?? 0,
    unreadMessages: messageRow?.count ?? 0,
    totalBudgetFcfa: budgetRow?.total ?? 0,
    averageProgress: progressRow?.average ?? 0,
  };
}

export async function getProjects() {
  if (!db) return [];

  await ensureBatizenDatabase();
  return db.select().from(batizenProjects).orderBy(desc(batizenProjects.createdAt));
}

export async function getQuotes() {
  if (!db) return [];

  await ensureBatizenDatabase();
  return db.select().from(batizenQuotes).orderBy(desc(batizenQuotes.createdAt));
}

export async function getMessages() {
  if (!db) return [];

  await ensureBatizenDatabase();
  return db.select().from(batizenMessages).orderBy(desc(batizenMessages.createdAt));
}

export async function getMaterials() {
  if (!db) return [];

  await ensureBatizenDatabase();
  return db.select().from(batizenMaterials);
}
