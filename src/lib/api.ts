import { API_URL, deviceTimeZone } from './config';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

let authToken: string | null = null;
export const setApiToken = (t: string | null) => { authToken = t; };
export const getApiToken = () => authToken;

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      headers: {
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        'X-Timezone': deviceTimeZone(),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network', 'Can’t reach Fortune Muse. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'error', data.message ?? 'Something went wrong.');
  return data as T;
}

export const wsUrl = (path: string) => `${API_URL.replace(/^http/, 'ws')}${path}?token=${encodeURIComponent(authToken ?? '')}`;

// --- Shared types -----------------------------------------------------------

export type Topic = 'wealth' | 'love';
export type Tier = 'standard' | 'detailed' | 'deep';
export type Mood = 'happy' | 'calm' | 'low' | 'surprised' | 'hopeful';

export interface AvatarData { baseId: string; customization: { palette: string; accessory: string; background: string }; mood: Mood }

export interface Me {
  id: string; email: string; email_verified: boolean; handle: string; role: 'user' | 'admin';
  country: string; timezone: string; gender: string | null; age_range: string | null;
  memory_enabled: boolean; rooms_enabled: boolean; avatar: AvatarData;
  /** Verified super account: readings are free. */
  super: boolean;
  inventory: { id: string; type: string; name: string; asset: string; available: number }[];
  freeReadings: number;
}

export interface Deity { id: string; name: string; title: string; theme: string; greeting: string; image_assets: { primary: string; secondary: string; emoji: string } }

export interface ReadingResult {
  deityMessage: string; answer: string;
  direction: { value: string; note: string };
  outfit: { style: string; color: string }; shoes: { style: string; color: string };
  avoidColor: string;
  song: { title: string; artist: string; spotifyUrl: string; appleMusicUrl: string };
  drink: string; food: string; luckyAction: string; gentleReminder: string;
  dos: string[]; donts: string[]; luckyHour?: string; reflections?: string[];
  disclaimer: string; aiGenerated: boolean;
}

export interface Reading {
  id: string; deityId: string; topic: Topic; tier: Tier; question: string;
  status: 'awaiting_payment' | 'generating' | 'ready' | 'failed' | 'refunded';
  price: number; orderId: string; createdAt: string; result: ReadingResult | null;
}

export interface SafetyResponse { kind: string; message: string; resources: { name: string; detail: string; url: string }[] }

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
