/* eslint-disable @typescript-eslint/no-explicit-any */
import { getVegasTournaments } from "@/lib/startgg";

// Moving these outside the component makes them "stable" for the render cycle
const now = Math.floor(Date.now() / 1000);

// 3. TIME BOUNDARIES (Vegas Focused)
// This creates a string of the current date in Vegas, then parses it
const vegasDateString = new Date().toLocaleDateString("en-US", {
  timeZone: "America/Los_Angeles",
});

const startOfToday = new Date(vegasDateString);
startOfToday.setHours(0, 0, 0, 0);

const endOfToday = new Date(vegasDateString);
endOfToday.setHours(23, 59, 59, 999);

const todayTs = Math.floor(startOfToday.getTime() / 1000);
const tonightTs = Math.floor(endOfToday.getTime() / 1000);

export default async function Home() {
  // 1. FETCH DATA
  const allTournaments = await getVegasTournaments();

  // 2. FILTER DATA: Using the stable 'now' from outside the function
  const localTournaments = allTournaments.filter((t: any) => {
    const isFuture = t.startAt > now;
    const hasStandings = t.events?.some((e: any) => e.standings?.nodes?.length > 0);
    const isLocal = t.isOnline === false; 

    return (isFuture || hasStandings) && isLocal;
  });

  // 3. CATEGORIZATION
  const tournamentsToday = localTournaments.filter((t: any) => t.startAt >= todayTs && t.startAt <= tonightTs);
  const otherTournaments = localTournaments.filter((t: any) => t.startAt < todayTs || t.startAt > tonightTs);

  const renderTournamentCard = (t: any) => {
    const isTournamentPast = t.startAt < now;
    
    return (
      <div key={t.id} className="border border-zinc-800 p-6 rounded-lg bg-zinc-950 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{t.name}</h2>
            <p className="text-sm text-zinc-400 mt-1">
            {new Date(t.startAt * 1000).toLocaleDateString("en-US", {
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              timeZone: "America/Los_Angeles" // <--- Ensure Pacific Time
            })}
          </p>
          </div>
          {t.startAt >= todayTs && t.startAt <= tonightTs && (
            <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter animate-pulse">
              Happening Today
            </span>
          )}
        </div>
        
        <p className="text-sm italic text-zinc-500 mb-4 mt-2">{t.venueAddress || "In-Person Venue"}</p>
        
        <div className="grid gap-4 mt-4 border-t border-zinc-800 pt-4">
          {t.events?.filter((event: any) => {
            const hasStandings = event.standings?.nodes?.length > 0;
            return !isTournamentPast || hasStandings;
          }).map((event: any) => (
            <div key={event.id} className="bg-zinc-900/50 p-3 rounded border border-zinc-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                {event.name}
              </h3>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">
                {event.videogame?.name}
              </p>

              {event.standings?.nodes?.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {event.standings.nodes.map((s: any, idx: number) => {
                    const isGold = s.placement === 1;
                    const isSilver = s.placement === 2;
                    const isBronze = s.placement === 3;

                    let rowStyles = "flex justify-between items-center py-1.5 px-3 rounded-md transition-all ";
                    let rankStyles = "font-black mr-3 w-4 ";

                    if (isGold) {
                      rowStyles += "bg-amber-500/10 border-l-2 border-amber-500";
                      rankStyles += "text-amber-500";
                    } else if (isSilver) {
                      rowStyles += "bg-zinc-400/5 border-l-2 border-zinc-400";
                      rankStyles += "text-zinc-400";
                    } else if (isBronze) {
                      rowStyles += "bg-orange-700/5 border-l-2 border-orange-700";
                      rankStyles += "text-orange-700";
                    } else {
                      rowStyles += "text-zinc-400";
                      rankStyles += "text-zinc-600";
                    }

                    return (
                      <div key={`${event.id}-${s.placement}-${idx}`} className={rowStyles}>
                        <span className="flex items-center text-sm font-medium text-zinc-200">
                          <span className={rankStyles}>{s.placement}</span>
                          {s.entrant.name}
                        </span>
                        {isGold && (
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Winner
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-600 italic">Upcoming</p>
              )}
            </div>
          ))}
        </div>

        <a 
          href={`https://start.gg/${t.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-blue-400 hover:underline text-sm font-medium"
        >
          View Tournament on start.gg →
        </a>
      </div>
    );
  };

  return (
    <main className="p-8 max-w-4xl mx-auto bg-black min-h-screen">
      <header className="mb-12">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">Vegas FGC Hub</h1>
        <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase mt-2">Local Tournament Scene</p>
      </header>

      {tournamentsToday.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-black text-red-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            Live / Today
          </h2>
          <div className="grid gap-6">
            {tournamentsToday.map(renderTournamentCard)}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-6">
          Schedule & Recent Results
        </h2>
        <div className="grid gap-6">
          {otherTournaments.length > 0 ? (
            otherTournaments.map(renderTournamentCard)
          ) : (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg bg-zinc-950/20">
              <p className="text-zinc-500 font-mono text-sm uppercase">No other local events found</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}