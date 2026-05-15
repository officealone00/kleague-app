/**
 * 내장 폴백 데이터
 * 모든 외부 fetch가 실패해도 빈 화면이 안 뜨도록 최소한의 시드 데이터를 번들에 포함.
 * 2026-05-14 K리그1 14R 기준값(네이버 K리그1 정보 카드).
 * 크롤러가 처음 도는 순간 자동으로 갱신됨.
 */

import type {
  TeamStanding,
  PlayerRecord,
  Meta,
  ScheduleData,
} from './api';

// 2026.5.14 네이버 K리그1 정보 카드 기준 (각 팀 14경기)
export const FALLBACK_STANDINGS: TeamStanding[] = [
  { rank: 1,  team: '서울', teamId: 'K09', games: 14, wins: 9, draws: 2, losses: 3, points: 29, goalsFor: 25, goalsAgainst: 11, goalDiff: 14, last5: '' },
  { rank: 2,  team: '울산', teamId: 'K01', games: 14, wins: 8, draws: 2, losses: 4, points: 26, goalsFor: 22, goalsAgainst: 18, goalDiff: 4,  last5: '' },
  { rank: 3,  team: '전북', teamId: 'K05', games: 14, wins: 6, draws: 5, losses: 3, points: 23, goalsFor: 20, goalsAgainst: 12, goalDiff: 8,  last5: '' },
  { rank: 4,  team: '포항', teamId: 'K03', games: 14, wins: 6, draws: 4, losses: 4, points: 22, goalsFor: 14, goalsAgainst: 12, goalDiff: 2,  last5: '' },
  { rank: 5,  team: '강원', teamId: 'K21', games: 14, wins: 6, draws: 3, losses: 5, points: 21, goalsFor: 17, goalsAgainst: 10, goalDiff: 7,  last5: '' },
  { rank: 6,  team: '인천', teamId: 'K18', games: 14, wins: 4, draws: 6, losses: 4, points: 18, goalsFor: 16, goalsAgainst: 17, goalDiff: -1, last5: '' },
  { rank: 7,  team: '제주', teamId: 'K04', games: 14, wins: 5, draws: 3, losses: 6, points: 18, goalsFor: 10, goalsAgainst: 12, goalDiff: -2, last5: '' },
  // 8~12위는 네이버 카드에서 잘려있어 추정치 (크롤러 첫 실행 시 자동 보정)
  { rank: 8,  team: '안양', teamId: 'K27', games: 14, wins: 4, draws: 3, losses: 7, points: 15, goalsFor: 13, goalsAgainst: 18, goalDiff: -5, last5: '' },
  { rank: 9,  team: '대전', teamId: 'K10', games: 14, wins: 3, draws: 5, losses: 6, points: 14, goalsFor: 12, goalsAgainst: 15, goalDiff: -3, last5: '' },
  { rank: 10, team: '김천', teamId: 'K35', games: 14, wins: 3, draws: 4, losses: 7, points: 13, goalsFor: 11, goalsAgainst: 17, goalDiff: -6, last5: '' },
  { rank: 11, team: '부천', teamId: 'K26', games: 14, wins: 3, draws: 3, losses: 8, points: 12, goalsFor: 10, goalsAgainst: 18, goalDiff: -8, last5: '' },
  { rank: 12, team: '광주', teamId: 'K22', games: 14, wins: 2, draws: 5, losses: 7, points: 11, goalsFor: 9,  goalsAgainst: 18, goalDiff: -9, last5: '' },
];

// 2026.5.14 네이버 선수 순위 기준 (최다 득점 TOP5 + 추가 추정)
export const FALLBACK_SCORERS: PlayerRecord[] = [
  { rank: 1, name: '무고사',   team: '인천', teamId: 'K18', goals: 7, assists: 1, attackPoints: 8, games: 14, perGame: 0.50 },
  { rank: 2, name: '이호재',   team: '포항', teamId: 'K03', goals: 7, assists: 0, attackPoints: 7, games: 14, perGame: 0.50 },
  { rank: 3, name: '야고',     team: '울산', teamId: 'K01', goals: 6, assists: 1, attackPoints: 7, games: 13, perGame: 0.46 },
  { rank: 4, name: '야부달라', team: '강원', teamId: 'K21', goals: 6, assists: 0, attackPoints: 6, games: 14, perGame: 0.43 },
  { rank: 5, name: '말컹',     team: '울산', teamId: 'K01', goals: 5, assists: 3, attackPoints: 8, games: 12, perGame: 0.42 },
];

// 2026.5.14 네이버 선수 순위 기준 (최다 도움 TOP5)
export const FALLBACK_ASSISTS: PlayerRecord[] = [
  { rank: 1, name: '마테우스', team: '안양', teamId: 'K27', goals: 1, assists: 3, attackPoints: 4, games: 14, perGame: 0.21 },
  { rank: 2, name: '이동경',   team: '울산', teamId: 'K01', goals: 2, assists: 3, attackPoints: 5, games: 13, perGame: 0.23 },
  { rank: 3, name: '이정택',   team: '김천', teamId: 'K35', goals: 0, assists: 3, attackPoints: 3, games: 14, perGame: 0.21 },
  { rank: 4, name: '송민규',   team: '서울', teamId: 'K09', goals: 3, assists: 3, attackPoints: 6, games: 14, perGame: 0.21 },
  { rank: 5, name: '이규성',   team: '울산', teamId: 'K01', goals: 0, assists: 3, attackPoints: 3, games: 13, perGame: 0.23 },
];

// 2026.5.16~17 네이버 일정 기준
export const FALLBACK_SCHEDULE: ScheduleData = {
  recent: [],
  upcoming: [
    { date: '2026.05.16', time: '16:30', homeId: 'K10', awayId: 'K09', home: '대전', away: '서울', homeScore: null, awayScore: null, stadium: '대전 월드컵', status: 'scheduled' },
    { date: '2026.05.16', time: '19:00', homeId: 'K18', awayId: 'K22', home: '인천', away: '광주', homeScore: null, awayScore: null, stadium: '인천 전용', status: 'scheduled' },
    { date: '2026.05.17', time: '16:30', homeId: 'K04', awayId: 'K27', home: '제주', away: '안양', homeScore: null, awayScore: null, stadium: '제주 월드컵', status: 'scheduled' },
    { date: '2026.05.17', time: '16:40', homeId: 'K05', awayId: 'K35', home: '전북', away: '김천', homeScore: null, awayScore: null, stadium: '전주 월드컵', status: 'scheduled' },
  ],
};

export const FALLBACK_META: Meta = {
  updatedAt: '2026-05-14T16:00:00.000Z',
  updatedAtKST: '2026. 5. 15. 오전 1:00:00',
  season: 2026,
  version: '2.0-seed',
  success: 4,
  total: 4,
};
