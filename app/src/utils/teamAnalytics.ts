/**
 * K리그 팀 리포트 생성기
 *
 * 이 모듈은 순위 + 선수 + 경기 데이터를 조합해
 * 응원팀의 의미있는 인사이트를 뽑아냅니다.
 * 리워드 광고 시청 후에만 공개됩니다.
 */

import type { TeamStanding, Player, GamesData } from './api';

export interface TeamReport {
  team: string;
  insight: string;
  form: {
    trend: 'up' | 'down' | 'steady';
    trendLabel: string;
    momentum: number; // 0-100
    momentumLabel: string;
    last10Record: string;
    streakType: 'win' | 'lose';
    streakCount: number;
    homeWinRate: number;
    awayWinRate: number;
  };
  outlook: {
    currentRank: number;
    gapToTop1: number;
    gapToTop4: number;
    gapToPostseason: number; // 파이널A 6위까지의 차이
    postseasonProbability: 'high' | 'medium' | 'low';
    projection: string;
  };
  topPlayers: {
    topBatter: { name: string; stat: string; value: string } | null;  // 최다 득점
    topHR: { name: string; stat: string; value: string } | null;     // 최다 공격P
    topPitcher: { name: string; stat: string; value: string } | null; // 최다 도움
    topSO: { name: string; stat: string; value: string } | null;     // 최다 슈팅
  };
  recentGames: Array<{
    date: string;
    opponent: string;
    isHome: boolean;
    teamScore: number;
    opponentScore: number;
    result: 'win' | 'lose' | 'draw' | 'pending';
  }>;
}

/**
 * 팀 리포트 생성 (메인 함수)
 */
export function generateTeamReport(
  team: string,
  standings: TeamStanding[],
  goals: Player[] | null,
  assists: Player[] | null,
  games: GamesData | null
): TeamReport {
  const stats = standings.find((s) => s.team === team);
  if (!stats) {
    return emptyReport(team);
  }

  // 팀 폼 분석
  const form = analyzeForm(stats);
  
  // 순위 전망
  const outlook = analyzeOutlook(stats, standings);
  
  // TOP 선수
  const topPlayers = findTopPlayers(team, goals, assists);
  
  // 최근 경기
  const recentGames = extractRecentGames(team, games);
  
  // 핵심 인사이트 (한 줄 요약)
  const insight = generateInsight(stats, form, outlook);

  return {
    team,
    insight,
    form,
    outlook,
    topPlayers,
    recentGames,
  };
}

// ─── 팀 폼 분석 ───
function analyzeForm(stats: TeamStanding): TeamReport['form'] {
  const last5 = stats.last5 || '';
  const wins = (last5.match(/승/g) || []).length;
  const draws = (last5.match(/무/g) || []).length;
  const losses = (last5.match(/패/g) || []).length;
  
  // 모멘텀: 승=3점, 무=1점, 패=0점 → 최대 15점을 100 스케일로
  const momentum = Math.min(100, Math.round((wins * 3 + draws * 1) / 15 * 100));

  let trend: 'up' | 'down' | 'steady' = 'steady';
  let trendLabel = '꾸준함';
  if (wins >= 3) { trend = 'up'; trendLabel = '상승세 🔥'; }
  else if (losses >= 3) { trend = 'down'; trendLabel = '하락세 😰'; }

  let momentumLabel = '보통';
  if (momentum >= 80) momentumLabel = '매우 좋음';
  else if (momentum >= 60) momentumLabel = '좋음';
  else if (momentum >= 40) momentumLabel = '보통';
  else if (momentum >= 20) momentumLabel = '주의';
  else momentumLabel = '위험';

  // 홈/원정 승률
  const homeWinRate = parseRecord(stats.home);
  const awayWinRate = parseRecord(stats.away);

  // 연승/연패
  const lastChar = last5[last5.length - 1] || '';
  let streakType: 'win' | 'lose' = 'win';
  let streakCount = 0;
  if (lastChar === '승') {
    streakType = 'win';
    for (let i = last5.length - 1; i >= 0 && last5[i] === '승'; i--) streakCount++;
  } else if (lastChar === '패') {
    streakType = 'lose';
    for (let i = last5.length - 1; i >= 0 && last5[i] === '패'; i--) streakCount++;
  }

  return {
    trend,
    trendLabel,
    momentum,
    momentumLabel,
    last10Record: `${wins}승${draws}무${losses}패`,
    streakType,
    streakCount: Math.max(1, streakCount),
    homeWinRate,
    awayWinRate,
  };
}

// "3-1-0" → 승률 계산
function parseRecord(record: string): number {
  if (!record || record === '-') return 0;
  const parts = record.split('-').map(Number);
  if (parts.length !== 3) return 0;
  const [w, d, l] = parts;
  const total = w + d + l;
  if (total === 0) return 0;
  return w / total;
}

// ─── 순위 전망 ───
function analyzeOutlook(stats: TeamStanding, standings: TeamStanding[]): TeamReport['outlook'] {
  const currentRank = stats.rank;
  const top1 = standings[0];
  const top4 = standings[3];
  const top6 = standings[5]; // 파이널A 컷

  const gapToTop1 = currentRank === 1 ? 0 : (top1?.points || 0) - stats.points;
  const gapToTop4 = currentRank <= 4 ? 0 : (top4?.points || 0) - stats.points;
  const gapToPostseason = currentRank <= 6 ? 0 : (top6?.points || 0) - stats.points;

  let postseasonProbability: 'high' | 'medium' | 'low' = 'medium';
  let projection = '';

  if (currentRank <= 3) {
    postseasonProbability = 'high';
    projection = `우승 경쟁권 (1~${Math.min(6, currentRank + 2)}위 예상)`;
  } else if (currentRank <= 6) {
    postseasonProbability = 'high';
    projection = `파이널A 진출 (${Math.max(1, currentRank - 2)}~${Math.min(6, currentRank + 2)}위 예상)`;
  } else if (currentRank <= 9) {
    postseasonProbability = 'medium';
    projection = `${Math.max(1, currentRank - 2)}~${Math.min(12, currentRank + 2)}위 예상`;
  } else {
    postseasonProbability = 'low';
    projection = `강등권 주의 (${Math.max(1, currentRank - 2)}~12위 예상)`;
  }

  return {
    currentRank,
    gapToTop1: Math.max(0, gapToTop1),
    gapToTop4: Math.max(0, gapToTop4),
    gapToPostseason: Math.max(0, gapToPostseason),
    postseasonProbability,
    projection,
  };
}

// ─── 팀 내 TOP 선수 ───
function findTopPlayers(
  team: string,
  goals: Player[] | null,
  assists: Player[] | null
): TeamReport['topPlayers'] {
  const teamGoals = (goals || []).filter((p) => p.team === team);
  const teamAssists = (assists || []).filter((p) => p.team === team);

  // 득점 1위
  const topGoal = teamGoals.sort((a, b) => b.goals - a.goals)[0];
  const topBatter = topGoal
    ? { name: topGoal.name, stat: '득점', value: `${topGoal.goals}골` }
    : null;

  // 공격포인트 1위
  const topAP = teamGoals.sort((a, b) => b.attackPoint - a.attackPoint)[0];
  const topHR = topAP
    ? { name: topAP.name, stat: '공격P', value: `${topAP.attackPoint}P` }
    : null;

  // 도움 1위
  const topAssist = teamAssists.sort((a, b) => b.assists - a.assists)[0];
  const topPitcher = topAssist
    ? { name: topAssist.name, stat: '도움', value: `${topAssist.assists}개` }
    : null;

  // 슈팅 1위
  const topShoots = teamGoals.sort((a, b) => b.shoots - a.shoots)[0];
  const topSO = topShoots
    ? { name: topShoots.name, stat: '슈팅', value: `${topShoots.shoots}회` }
    : null;

  return { topBatter, topHR, topPitcher, topSO };
}

// ─── 최근 경기 ───
function extractRecentGames(team: string, games: GamesData | null): TeamReport['recentGames'] {
  if (!games) return [];

  const all = [
    ...(games.yesterday?.games || []).map(g => ({ ...g, date: games.yesterday.date })),
    ...(games.today?.games || []).map(g => ({ ...g, date: games.today.date })),
  ];

  return all
    .filter(g => g.home === team || g.away === team)
    .map(g => {
      const isHome = g.home === team;
      const teamScore = isHome ? (g.homeScore ?? 0) : (g.awayScore ?? 0);
      const opponentScore = isHome ? (g.awayScore ?? 0) : (g.homeScore ?? 0);
      const opponent = isHome ? g.away : g.home;

      let result: 'win' | 'lose' | 'draw' | 'pending' = 'pending';
      if (g.homeScore !== null && g.awayScore !== null) {
        if (teamScore > opponentScore) result = 'win';
        else if (teamScore < opponentScore) result = 'lose';
        else result = 'draw';
      }

      // 날짜 포맷
      const dateStr = g.date && g.date.length === 8
        ? `${g.date.slice(4, 6)}.${g.date.slice(6, 8)}`
        : '';

      return { date: dateStr, opponent, isHome, teamScore, opponentScore, result };
    });
}

// ─── 핵심 인사이트 (한 줄 요약) ───
function generateInsight(stats: TeamStanding, form: TeamReport['form'], outlook: TeamReport['outlook']): string {
  if (stats.rank === 1 && form.trend === 'up') {
    return '🏆 선두에서 상승세! 우승 가도를 달리고 있어요.';
  }
  if (stats.rank <= 3 && form.trend === 'up') {
    return '🔥 우승권에서 상승세! 1위도 노려볼 만해요.';
  }
  if (stats.rank <= 6 && form.trend === 'up') {
    return '💪 기세를 몰아 파이널A 확정을 노려볼 만해요.';
  }
  if (stats.rank <= 6 && form.trend === 'down') {
    return '⚠️ 파이널A 컷에 근접! 분위기 반등이 필요해요.';
  }
  if (stats.rank >= 10 && form.trend === 'up') {
    return '✨ 반등의 기회! 중위권 도약을 노려볼 시점이에요.';
  }
  if (stats.rank === 12) {
    return '🆘 강등권 탈출이 급선무. 다음 경기부터 총력전이 필요해요.';
  }
  if (form.streakType === 'win' && form.streakCount >= 3) {
    return `🔥 ${form.streakCount}연승 행진! 상승세가 이어지고 있어요.`;
  }
  if (form.streakType === 'lose' && form.streakCount >= 3) {
    return `😰 ${form.streakCount}연패 중. 분위기 전환이 절실해요.`;
  }
  return `📊 현재 ${stats.rank}위. ${outlook.projection}`;
}

// ─── 빈 리포트 (데이터 없을 때) ───
function emptyReport(team: string): TeamReport {
  return {
    team,
    insight: '데이터를 불러올 수 없어요',
    form: {
      trend: 'steady',
      trendLabel: '-',
      momentum: 0,
      momentumLabel: '-',
      last10Record: '-',
      streakType: 'win',
      streakCount: 0,
      homeWinRate: 0,
      awayWinRate: 0,
    },
    outlook: {
      currentRank: 0,
      gapToTop1: 0,
      gapToTop4: 0,
      gapToPostseason: 0,
      postseasonProbability: 'low',
      projection: '-',
    },
    topPlayers: { topBatter: null, topHR: null, topPitcher: null, topSO: null },
    recentGames: [],
  };
}
