/**
 * 데이터 API
 *
 * GitHub repo의 data/*.json을 jsdelivr CDN으로 불러옵니다.
 * - 재시도: 최대 3회 (지수 백오프: 500ms → 1s → 2s)
 * - 타임아웃: 8초
 * - 폴백 CDN: jsdelivr 장애 시 raw.githubusercontent 시도
 * - 최종 폴백: 내장 기본 데이터 (빈 화면 방지)
 */

import {
  FALLBACK_STANDINGS,
  FALLBACK_GOALS,
  FALLBACK_ASSISTS,
  FALLBACK_GAMES,
  FALLBACK_META,
} from './fallback';

const CONFIG = {
  githubUser: 'officealone00',
  repo: 'kleague-app',
  branch: 'main',
};

function cdnUrl(path: string): string {
  const { githubUser, repo, branch } = CONFIG;
  return `https://cdn.jsdelivr.net/gh/${githubUser}/${repo}@${branch}/${path}`;
}

function cdnUrlBackup(path: string): string {
  const { githubUser, repo, branch } = CONFIG;
  return `https://raw.githubusercontent.com/${githubUser}/${repo}/${branch}/${path}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJsonWithRetry<T>(path: string, fallback: T): Promise<T> {
  const buster = Math.floor(Date.now() / (10 * 60 * 1000));
  const primary = `${cdnUrl(path)}?v=${buster}`;
  const backup = `${cdnUrlBackup(path)}?v=${buster}`;

  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetchWithTimeout(primary);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`[api] jsdelivr ${i + 1} 실패: ${path}`, e);
    }
    if (i < 2) await sleep(500 * Math.pow(2, i));
  }

  try {
    const res = await fetchWithTimeout(backup);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`[api] raw 폴백 실패: ${path}`, e);
  }

  console.warn(`[api] 모든 요청 실패, 폴백: ${path}`);
  return fallback;
}

// ─── 타입 정의 ──────────────────────────────
export interface TeamStanding {
  rank: number;
  team: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  last5: string;
  home: string;
  away: string;
}

export interface Player {
  rank: number;
  name: string;
  team: string;
  games: number;
  goals: number;
  assists: number;
  shoots: number;
  attackPoint: number;
  position: string;
}

export interface Game {
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  time?: string;
  stadium?: string;
}

export interface GamesData {
  today: { date: string; games: Game[] };
  yesterday: { date: string; games: Game[] };
}

export interface Meta {
  updatedAt: string;
  updatedAtKST: string;
  season: number;
  success: number;
  total: number;
  league?: string;
}

// ─── API ──────────────────────────────
export const api = {
  standings: () => fetchJsonWithRetry<TeamStanding[]>('data/standings.json', FALLBACK_STANDINGS),
  goals: () => fetchJsonWithRetry<Player[]>('data/goals.json', FALLBACK_GOALS),
  assists: () => fetchJsonWithRetry<Player[]>('data/assists.json', FALLBACK_ASSISTS),
  games: () => fetchJsonWithRetry<GamesData>('data/games.json', FALLBACK_GAMES),
  meta: () => fetchJsonWithRetry<Meta>('data/meta.json', FALLBACK_META),
};
