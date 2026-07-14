import { BottomNav } from "@/components/layout/BottomNav";
import { PremiumHeader } from "@/components/layout/PremiumHeader";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { Badge } from "@/components/ui/Badge";
import { getMessages } from "@/services/batizen";
import { WeatherWidget } from "@/components/btp/WeatherWidget";

export default async function MessagesPage() {
  const messages = await getMessages();

  return (
    <ScreenWrapper>
      <PremiumHeader />

      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B5FFF]">Messages</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
          Communication chantier
        </h1>
        <p className="mt-2 text-[#6B7280]">Tous vos échanges avec l'équipe BÂTIZEN.</p>
      </div>

      <div className="mb-6 flex justify-center sm:justify-start">
        <WeatherWidget title="Météo de votre rendez-vous" />
      </div>

      <div className="space-y-3">
        {messages.map((message) => (
          <article
            key={message.id}
            className="flex items-start gap-4 rounded-[24px] border border-[#E7EBF5] bg-white p-5 shadow-[0_4px_16px_rgba(16,24,40,0.05)] transition hover:border-[#0B5FFF]/20 hover:shadow-[0_8px_28px_rgba(11,95,255,0.08)]"
            aria-label={`Message de ${message.sender} : ${message.subject}`}
          >
            {/* Avatar initiales */}
            <div className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-sm font-black text-white shadow-sm">
              {message.sender.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-[#111827]">{message.sender}</p>
                  <h2 className="mt-0.5 text-base font-black text-[#0D2B6B]">{message.subject}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {message.unread && (
                    <span className="size-2 rounded-full bg-[#FF7A00]" aria-label="Non lu" />
                  )}
                  <Badge tone={message.unread ? "orange" : "gray"}>{message.channel}</Badge>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-[#6B7280]">{message.preview}</p>
            </div>
          </article>
        ))}
      </div>

      <BottomNav />
    </ScreenWrapper>
  );
}
