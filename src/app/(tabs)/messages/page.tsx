import { Badge } from "@/components/ui/Badge";
import { getMessages } from "@/services/batizen";
import { WeatherWidget } from "@/components/btp/WeatherWidget";

export default async function MessagesPage() {
  const messages = await getMessages();

  return (
    <>
      <main className="ios-scroll min-h-screen pt-4 pb-16 px-2">
        <div className="w-full">
            <div className="mb-7 mx-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white drop-shadow-md">Messages</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl drop-shadow-lg">
                Communication chantier
              </h1>
              <p className="mt-2 text-white/80 drop-shadow-md">Tous vos échanges avec l'équipe BÂTIZEN.</p>
            </div>

            <div className="mb-6 flex justify-center sm:justify-start mx-2">
              <WeatherWidget title="Météo de votre rendez-vous" />
            </div>

            <div className="space-y-3 mx-2">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="flex items-start gap-4 rounded-[24px] border border-white/30 bg-white/20 backdrop-blur-xl p-5 shadow-lg transition hover:border-white/50 hover:shadow-xl dark:border-[#1D3557]/50"
                  aria-label={`Message de ${message.sender} : ${message.subject}`}
                >
                  {/* Avatar initiales */}
                  <div className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#0B5FFF,#0D2B6B)] text-sm font-black text-white shadow-sm">
                    {message.sender.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-white drop-shadow-md">{message.sender}</p>
                        <h2 className="mt-0.5 text-base font-black text-white drop-shadow-md">{message.subject}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {message.unread && (
                          <span className="size-2 rounded-full bg-[#FF7A00] shadow-md" aria-label="Non lu" />
                        )}
                        <Badge tone={message.unread ? "orange" : "gray"}>{message.channel}</Badge>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-white/90 drop-shadow-md">{message.preview}</p>
                  </div>
                </article>
              ))}
            </div>

          </div>
        </main>
    </>
  );
}