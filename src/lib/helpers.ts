export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export const imagePaths = {
  logo: "/assets/images/logo.png",
  hero: "/assets/images/hero-villa.jpg",
  projectVilla: "/assets/images/project-villa-abidjan.jpg",
  projectDuplex: "/assets/images/project-duplex-yamoussoukro.jpg",
  onboarding: "/assets/images/onboarding-site.jpg",
} as const;
