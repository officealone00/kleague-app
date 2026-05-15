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
  FALLBACK_SCORERS,
  FALLBACK_ASSISTS,
  FALLBACK_SCHEDULE,
  FALLBACK_META,
} from './fallback';

const CONFIG = {
  githubUser: 'officealone00',
  repo: 'kleague-app',
  branch: 'main',
};

function cdnUrl(path: string): string {
  const { githubUser, repo, branch } = CONFIG;
  // jsdelivr 형식: https://cdn.jsdelivr.net/gh/{user}/{repo}@{branch}/{path}
  return `https://cdn.jsdelivr.net/gh/${githubUser}/${repo}@${branch}/${path}`;
}

// 대체 CDN (jsdelivr 장애 시 사용)
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
  // 캐시 버스터: 10분 단위로 바뀌도록 (CDN은 보통 10분 캐시)
  const buster = Math.floor(Date.now() / (10 * 60 * 1000));
  const primary = `${cdnUrl(path)}?v=${buster}`;
  const backup = `${cdnUrlBackup(path)}?v=${buster}`;

  // 1~3차: jsdelivr (지수 백오프)
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetchWithTimeout(primary);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`[api] jsdelivr 시도 ${i + 1} 실패: ${path}`, e);
    }
    if (i < 2) await sleep(500 * Math.pow(2, i)); // 500ms, 1s
  }

  // 4차: raw.githubusercontent 폴백 CDN
  try {
    const res = await fetchWithTimeout(backup);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`[api] raw 폴백 실패: ${path}`, e);
  }

  // 최종 폴백: 내장 기본 데이터 (빈 화면 방지)
  console.warn(`[api] 모든 요청 실패, 폴백 데이터 사용: ${path}`);
  return fallback;
}

// ─── 타입 정의 ──────────────────────────────
export interface TeamStanding {
  rank: number;
  team: string;        // 짧은 이름 (예: '서울')
  teamId: string;      // K리그 공식 ID (예: 'K09')
  games: number;       // 경기수
  wins: number;        // 승
  draws: number;       // 무
  losses: number;      // 패
  points: number;      // 승점
  goalsFor: number;    // 득점
  goalsAgainst: number;// 실점
  goalDiff: number;    // 득실차
  last5: string;       // 최근 5경기 (예: '승무승패승')
}

export interface PlayerRecord {
  rank: number;
  name: string;
  team: string;        // 짧은 팀명
  teamId: string;      // 공식 ID
  goals: number;
  assists: number;
  attackPoints: number; // 공격포인트 (득점 + 도움)
  games: number;
  shots?: number;
  perGame?: number;     // 경기당 기록
}

export interface ScheduleGame {
  date: string;        // 'YYYY.MM.DD'
  time: string;        // 'HH:MM'
  homeId: string | null;
  awayId: string | null;
  home: string;        // 짧은 팀명
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  stadium: string;
  status: 'finished' | 'scheduled';
}

export interface ScheduleData {
  recent: ScheduleGame[];   // 전회경기결과 (최근 종료 경기, 최신순)
  upcoming: ScheduleGame[]; // 다음경기일정 (예정, 가까운 순)
}

export interface Meta {
  updatedAt: string;
  updatedAtKST: string;
  season: number;
  version: string;
  success: number;
  total: number;
}

// ─── API 함수들 (모두 자동 폴백 내장) ──────────────────────────────
export const api = {
  standings: () =>
    fetchJsonWithRetry<TeamStanding[]>('data/standings.json', FALLBACK_STANDINGS),
  scorers: () =>
    fetchJsonWithRetry<PlayerRecord[]>('data/scorers.json', FALLBACK_SCORERS),
  assists: () =>
    fetchJsonWithRetry<PlayerRecord[]>('data/assists.json', FALLBACK_ASSISTS),
  schedule: () =>
    fetchJsonWithRetry<ScheduleData>('data/schedule.json', FALLBACK_SCHEDULE),
  meta: () =>
    fetchJsonWithRetry<Meta>('data/meta.json', FALLBACK_META),
};
