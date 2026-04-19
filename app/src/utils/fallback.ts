/**
 * 네트워크 실패 시 폴백 데이터
 */

import type { TeamStanding, Player, GamesData, Meta } from './api';

export const FALLBACK_STANDINGS: TeamStanding[] = [
  { rank: 1, team: '전북', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 2, team: '울산', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 3, team: '포항', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 4, team: '서울', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 5, team: '대전', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 6, team: '제주', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 7, team: '김천', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 8, team: '강원', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 9, team: '광주', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 10, team: '인천', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 11, team: '안양', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
  { rank: 12, team: '부천', games: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, last5: '-', home: '-', away: '-' },
];

export const FALLBACK_GOALS: Player[] = [];
export const FALLBACK_ASSISTS: Player[] = [];

export const FALLBACK_GAMES: GamesData = {
  today: { date: '', games: [] },
  yesterday: { date: '', games: [] },
};

export const FALLBACK_META: Meta = {
  updatedAt: new Date().toISOString(),
  updatedAtKST: new Date().toLocaleString('ko-KR'),
  season: new Date().getFullYear(),
  success: 0,
  total: 4,
  league: 'K리그1',
};
