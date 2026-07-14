"use client";

import { useEffect, useState, useMemo } from "react";

export type WeatherWidgetProps = {
  lat?: number;
  lng?: number;
  title?: string;
  className?: string;
};

type CurrentWeather = {
  temperature: number;
  windspeed: number;
  weathercode: number;
};

type DailyItem = {
  date: string;
  code: number;
  tmax: number;
  tmin: number;
};

type WeatherData = {
  temp: number;
  windspeed: number;
  code: number;
  daily: DailyItem[];
  isDay: boolean;
};

const FALLBACK = { lat: 5.3599, lng: -4.0083, city: "Abidjan" };

const codeToInfo = (code: number): { label: string; icon: string } => {
  if (code === 0) return { label: "Ensoleillé", icon: "☀️" };
  if (code <= 2) return { label: "Partiellement nuageux", icon: "⛅" };
  if (code === 3) return { label: "Nuageux", icon: "☁️" };
  if (code <= 48) return { label: "Brouillard", icon: "🌫️" };
  if (code <= 67) return { label: "Pluie", icon: "🌧️" };
  if (code <= 77) return { label: "Neige", icon: "❄️" };
  if (code <= 82) return { label: "Averses", icon: "🌦️" };
  if (code <= 86) return { label: "Neige forte", icon: "❄️" };
  return { label: "Orage", icon: "⛈️" };
};

function getAlerts(w: WeatherData): { text: string; level: "danger" | "vigilance" }[] {
  const alerts: { text: string; level: "danger" | "vigilance" }[] = [];
  const rain = w.code >= 51 || (w.daily?.some((d) => d.code >= 51));
  const strongWind = w.windspeed >= 30;
  const heat = w.temp >= 35;

  if (rain) {
    alerts.push({
      text: "Pluie prévue - Déconseillé pour : béton, peinture extérieure",
      level: "danger",
    });
  }
  if (strongWind) {
    alerts.push({
      text: "Vent fort - Déconseillé pour : toiture, échafaudages",
      level: "danger",
    });
  }
  if (heat) {
    alerts.push({
      text: "Forte chaleur - Hydratez vos ouvriers",
      level: "vigilance",
    });
  }
  return alerts;
}

const CACHE_KEY = "batizen_weather_cache";
const CACHE_TTL = 30 * 60 * 1000;

async function getCityName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=fr`
    );
    const json = await res.json();
    return json?.city || json?.locality || json?.principalSubdivision || FALLBACK.city;
  } catch {
    return FALLBACK.city;
  }
}

export function WeatherWidget({ lat, lng, title, className = "" }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [city, setCity] = useState<string>(FALLBACK.city);
  const [loading, setLoading] = useState(true);
  
  const coords = useMemo(() => {
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
    return new Promise<{ lat: number; lng: number }>((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({ lat: FALLBACK.lat, lng: FALLBACK.lng }),
          { timeout: 5000 }
        );
      } else {
        resolve({ lat: FALLBACK.lat, lng: FALLBACK.lng });
      }
    });
  }, [lat, lng]);

  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number }>({ lat: FALLBACK.lat, lng: FALLBACK.lng });

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(coords).then((c) => {
      if (!cancelled) setResolvedCoords(c);
    });
    return () => { cancelled = true; };
  }, [coords]);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      setLoading(true);
      try {
        const cacheRaw = localStorage.getItem(CACHE_KEY);
        if (cacheRaw) {
          const parsed = JSON.parse(cacheRaw);
          if (
            parsed.coords &&
            Math.abs(parsed.coords.lat - resolvedCoords.lat) < 0.5 &&
            Math.abs(parsed.coords.lng - resolvedCoords.lng) < 0.5 &&
            Date.now() - parsed.time < CACHE_TTL
          ) {
            if (!cancelled) {
              setData(parsed.data);
              setCity(parsed.city || FALLBACK.city);
              setLoading(false);
            }
            return;
          }
        }

        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${resolvedCoords.lat}&longitude=${resolvedCoords.lng}` +
          `&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const res = await fetch(url);
        const json = await res.json();
        const cur: CurrentWeather = json.current_weather;
        const daily: DailyItem[] = (json.daily?.time || []).map(
          (date: string, i: number) => ({
            date,
            code: json.daily.weathercode[i],
            tmax: json.daily.temperature_2m_max[i],
            tmin: json.daily.temperature_2m_min[i],
          })
        );

        const hours = new Date().getHours();
        const isDay = hours >= 6 && hours < 19;

        const payload: WeatherData = {
          temp: Math.round(cur.temperature),
          windspeed: Math.round(cur.windspeed),
          code: cur.weathercode,
          daily: daily.slice(0, 3),
          isDay,
        };

        const cityName = await getCityName(resolvedCoords.lat, resolvedCoords.lng);
        if (!cancelled) setCity(cityName);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ coords: resolvedCoords, time: Date.now(), data: payload, city: cityName })
        );

        if (!cancelled) {
          setData(payload);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [resolvedCoords]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center rounded-[12px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] ${className}`}
        style={{ width: "100%", height: 120, background: "linear-gradient(135deg,#4A90E2,#2C5FA8)" }}
      >
        <div className="size-6 animate-spin rounded-full border-3 border-white/40 border-t-white" />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`flex items-center justify-center rounded-[12px] p-3 text-center text-sm font-bold text-white ${className}`}
        style={{ width: "100%", height: 120, background: "linear-gradient(135deg,#4A90E2,#2C5FA8)" }}
      >
        Météo indisponible
      </div>
    );
  }

  const info = codeToInfo(data.code);
  const alerts = getAlerts(data);
  const bg = data.isDay
    ? "linear-gradient(135deg,#4A90E2,#2C5FA8)"
    : "linear-gradient(135deg,#1A2A6C,#0B1437)";

  return (
    <div
      className={`overflow-hidden rounded-[12px] p-3 text-white shadow-[0_8px_25px_rgba(0,0,0,0.15)] ${className}`}
      style={{ width: "100%", height: 120, background: bg }}
    >
      <div className="flex h-full items-center justify-between gap-3">
        {/* Gauche : Icône météo animée */}
        <div className="flex-shrink-0">
          <span className="animate-float text-5xl">{info.icon}</span>
        </div>

        {/* Milieu : Température + conditions + ville */}
        <div className="flex flex-1 flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
            {title || city}
          </p>
          <p className="text-3xl font-black leading-none">{data.temp}°C</p>
          <p className="text-[12px] font-semibold">{info.label}</p>
        </div>

        {/* Droite : Prévisions 3 jours */}
        <div className="flex-shrink-0 border-l border-white/20 pl-3">
          <div className="flex flex-col gap-1.5">
            {data.daily.map((d, i) => {
              const di = codeToInfo(d.code);
              const day = new Date(d.date).toLocaleDateString("fr-FR", { weekday: "short" });
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase text-white/70 w-8">
                    {i === 0 ? "Auj" : day}
                  </span>
                  <span className="text-sm">{di.icon}</span>
                  <span className="text-[10px] font-semibold">{d.tmax}°</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mt-2 space-y-1">
          {alerts.map((a, i) => (
            <p
              key={i}
              className="rounded-md px-2 py-1 text-[10px] font-bold"
              style={{
                background: a.level === "danger" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)",
                color: a.level === "danger" ? "#FCA5A5" : "#FCD34D",
                border: `1px solid ${a.level === "danger" ? "#EF4444" : "#F59E0B"}`,
              }}
            >
              ⚠️ {a.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}