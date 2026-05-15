/**
 * K리그 팀 분석 리포트 생성 로직
 * - standings: 팀 순위/승점/득실/최근5경기
 * - scorers: 득점 순위
 * - assists: 도움 순위
 * 위 3개 데이터를 조합해 즐겨찾기 팀의 분석 리포트를 만듭니다.
 */

import type { TeamStanding, PlayerRecord } from './api';

// ─── 리포트 타입 정의 ──────────────────────────────

export interface TeamReport {
  insight: string; // 한 줄 핵심 인사이트
  form: TeamForm;
  outlook: TeamOutlook;
  topPlayers: TopPlayers;
  comparison: LeagueComparison;
}

export interface TeamForm {
  rank: number;
  points: number;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;             // 0~1
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  trend: 'up' | 'down' | 'steady';
  trendLabel: string;
  momentum: number;            // 0~100
  momentumLabel: string;
  last5Record: string;         // 예: '3승1무1패'
  recentForm: string;          // 예: '승무승패승' (가장 최근이 우측)
  streakType: 'win' | 'lose' | 'draw' | 'mixed';
  streakCount: number;
}

export interface TeamOutlook {
  pointsBehindLeader: number;
  pointsAheadRelegation: number;
  remainingGames: number;
  championProb: 'high' | 'medium' | 'low';
  acl1Prob: 'high' | 'medium' | 'low';   // 챔피언스리그 진출권 (1~3위 가정)
  relegationProb: 'high' | 'medium' | 'low';
}

export interface TopPlayers {
  topScorer: { name: string; goals: number; rank: number } | null;
  topAssister: { name: string; assists: number; rank: number } | null;
  topAttackPoint: { name: string; goals: number; assists: number; total: number } | null;
}

export interface LeagueComparison {
  pointsVsAvg: number;       // 리그 평균 대비 +/- 승점
  goalsForVsAvg: number;     // 리그 평균 대비 +/- 득점
  goalsAgainstVsAvg: number; // 리그 평균 대비 +/- 실점 (음수면 좋음)
  attackRank: number;        // 득점 기준 순위
  defenseRank: number;       // 실점 기준 순위 (1=최저실점)
}

// ─── 메인 함수 ──────────────────────────────

export function generateTeamReport(
  favoriteTeam: string,
  standings: TeamStanding[],
  scorers: PlayerRecord[] | null,
  assists: PlayerRecord[] | null
): TeamReport | null {
  const myTeam = standings.find((s) => s.team === favoriteTeam);
  if (!myTeam) return null;

  const form = analyzeForm(myTeam);
  const outlook = analyzeOutlook(myTeam, standings);
  const topPlayers = findTopPlayers(favoriteTeam, scorers, assists);
  const comparison = compareToLeague(myTeam, standings);
  const insight = generateInsight(myTeam, form, outlook, comparison);

  return { insight, form, outlook, topPlayers, comparison };
}

// ─── 1. 팀 폼 분석 ──────────────────────────────

function analyzeForm(team: TeamStanding): TeamForm {
  const winRate = team.games > 0 ? team.wins / team.games : 0;

  // 최근 5경기 분석
  const last5 = (team.last5 || '').split('');
  const wins5 = last5.filter((c) => c === '승').length;
  const draws5 = last5.filter((c) => c === '무').length;
  const losses5 = last5.filter((c) => c === '패').length;
  const last5Record = `${wins5}승${draws5}무${losses5}패`;

  // 모멘텀 점수 (0~100): 최근 5경기 기반
  // 승=20점, 무=10점, 패=0점
  const momentum = wins5 * 20 + draws5 * 10;
  const momentumLabel =
    momentum >= 80 ? '최고조' :
    momentum >= 60 ? '좋음' :
    momentum >= 40 ? '보통' :
    momentum >= 20 ? '부진' : '최악';

  // 트렌드: 최근 5경기 vs 시즌 평균 승률
  const recent5WinRate = last5.length > 0 ? wins5 / last5.length : winRate;
  let trend: 'up' | 'down' | 'steady' = 'steady';
  let trendLabel = '꾸준한 페이스';
  if (recent5WinRate > winRate + 0.15) {
    trend = 'up';
    trendLabel = '상승세';
  } else if (recent5WinRate < winRate - 0.15) {
    trend = 'down';
    trendLabel = '하락세';
  }

  // 연승/연패 (가장 최근부터 같은 결과 카운트)
  let streakType: 'win' | 'lose' | 'draw' | 'mixed' = 'mixed';
  let streakCount = 0;
  if (last5.length > 0) {
    const latest = last5[last5.length - 1];
    streakType = latest === '승' ? 'win' : latest === '패' ? 'lose' : 'draw';
    streakCount = 1;
    for (let i = last5.length - 2; i >= 0; i--) {
      if (last5[i] === latest) streakCount++;
      else break;
    }
  }

  return {
    rank: team.rank,
    points: team.points,
    games: team.games,
    wins: team.wins,
    draws: team.draws,
    losses: team.losses,
    winRate,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    goalDiff: team.goalDiff,
    trend,
    trendLabel,
    momentum,
    momentumLabel,
    last5Record,
    recentForm: team.last5 || '',
    streakType,
    streakCount,
  };
}

// ─── 2. 순위 전망 ──────────────────────────────

function analyzeOutlook(
  team: TeamStanding,
  standings: TeamStanding[]
): TeamOutlook {
  const sorted = [...standings].sort((a, b) => a.rank - b.rank);
  const leader = sorted[0];
  // K리그1은 12팀, 보통 11~12위가 강등권 (정확한 룰은 시즌마다 다르지만 보수적으로 12위 기준)
  const lastIdx = sorted.length - 1;
  const relegation = sorted[lastIdx];

  const pointsBehindLeader = Math.max(0, leader.points - team.points);
  const pointsAheadRelegation = Math.max(0, team.points - relegation.points);

  // K리그1 정규 라운드 33경기 + 파이널 라운드 5경기 = 38경기 (시즌마다 변동 가능)
  // 보수적으로 38경기 기준
  const SEASON_GAMES = 38;
  const remainingGames = Math.max(0, SEASON_GAMES - team.games);

  // 우승 가능성: 승점 차 + 남은 경기 고려
  const maxPossiblePoints = team.points + remainingGames * 3;
  const championProb: 'high' | 'medium' | 'low' =
    team.rank === 1 ? 'high' :
    team.rank <= 3 && pointsBehindLeader <= remainingGames * 1.5 ? 'medium' :
    maxPossiblePoints > leader.points ? 'low' : 'low';

  // ACL 진출권 (1~3위)
  const acl1Prob: 'high' | 'medium' | 'low' =
    team.rank <= 3 ? 'high' :
    team.rank <= 6 ? 'medium' : 'low';

  // 강등 가능성
  const relegationProb: 'high' | 'medium' | 'low' =
    team.rank === sorted.length ? 'high' :
    team.rank >= sorted.length - 1 ? 'medium' :
    pointsAheadRelegation <= remainingGames * 1.5 ? 'medium' : 'low';

  return {
    pointsBehindLeader,
    pointsAheadRelegation,
    remainingGames,
    championProb,
    acl1Prob,
    relegationProb,
  };
}

// ─── 3. 팀 내 TOP 선수 ──────────────────────────────

function findTopPlayers(
  favoriteTeam: string,
  scorers: PlayerRecord[] | null,
  assists: PlayerRecord[] | null
): TopPlayers {
  const teamScorers = (scorers || []).filter((p) => p.team === favoriteTeam);
  const teamAssisters = (assists || []).filter((p) => p.team === favoriteTeam);

  const topScorer = teamScorers.length > 0
    ? {
        name: teamScorers[0].name,
        goals: teamScorers[0].goals,
        rank: teamScorers[0].rank,
      }
    : null;

  const topAssister = teamAssisters.length > 0
    ? {
        name: teamAssisters[0].name,
        assists: teamAssisters[0].assists,
        rank: teamAssisters[0].rank,
      }
    : null;

  // 공격포인트 1위: scorers와 assists를 모두 모아 합산
  const apMap = new Map<string, { goals: number; assists: number }>();
  teamScorers.forEach((p) => {
    apMap.set(p.name, { goals: p.goals, assists: apMap.get(p.name)?.assists ?? p.assists ?? 0 });
  });
  teamAssisters.forEach((p) => {
    const cur = apMap.get(p.name) ?? { goals: 0, assists: 0 };
    apMap.set(p.name, { goals: cur.goals || p.goals || 0, assists: p.assists });
  });

  let topAP: { name: string; goals: number; assists: number; total: number } | null = null;
  apMap.forEach((v, name) => {
    const total = (v.goals || 0) + (v.assists || 0);
    if (!topAP || total > topAP.total) {
      topAP = { name, goals: v.goals || 0, assists: v.assists || 0, total };
    }
  });

  return {
    topScorer,
    topAssister,
    topAttackPoint: topAP,
  };
}

// ─── 4. 리그 평균 비교 ──────────────────────────────

function compareToLeague(
  team: TeamStanding,
  standings: TeamStanding[]
): LeagueComparison {
  const n = standings.length || 1;
  const avgPoints = standings.reduce((s, t) => s + t.points, 0) / n;
  const avgGoalsFor = standings.reduce((s, t) => s + t.goalsFor, 0) / n;
  const avgGoalsAgainst = standings.reduce((s, t) => s + t.goalsAgainst, 0) / n;

  // 득점 순위 (많을수록 1위)
  const byAttack = [...standings].sort((a, b) => b.goalsFor - a.goalsFor);
  const attackRank = byAttack.findIndex((t) => t.team === team.team) + 1;

  // 실점 순위 (적을수록 1위 = 수비 좋음)
  const byDefense = [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst);
  const defenseRank = byDefense.findIndex((t) => t.team === team.team) + 1;

  return {
    pointsVsAvg: Math.round((team.points - avgPoints) * 10) / 10,
    goalsForVsAvg: Math.round((team.goalsFor - avgGoalsFor) * 10) / 10,
    goalsAgainstVsAvg: Math.round((team.goalsAgainst - avgGoalsAgainst) * 10) / 10,
    attackRank,
    defenseRank,
  };
}

// ─── 5. 핵심 인사이트 한 줄 ──────────────────────────────

function generateInsight(
  team: TeamStanding,
  form: TeamForm,
  outlook: TeamOutlook,
  comparison: LeagueComparison
): string {
  // 우선순위: 1) 우승권 2) 강등권 3) 폼 4) 일반
  if (outlook.championProb === 'high') {
    return `🏆 ${team.team}이(가) 리그 선두를 달리고 있어요!`;
  }
  if (outlook.championProb === 'medium' && outlook.pointsBehindLeader <= 5) {
    return `🔥 우승까지 ${outlook.pointsBehindLeader}점 차, 충분히 따라잡을 수 있어요!`;
  }
  if (outlook.relegationProb === 'high') {
    return `⚠️ 강등권에서 분투 중! ${outlook.remainingGames}경기 남았어요.`;
  }
  if (form.trend === 'up' && form.streakType === 'win' && form.streakCount >= 3) {
    return `🔥 ${form.streakCount}연승 중! 상승세를 이어가고 있어요.`;
  }
  if (form.trend === 'down' && form.streakType === 'lose' && form.streakCount >= 3) {
    return `😢 ${form.streakCount}연패 중. 반등이 필요한 시기예요.`;
  }
  if (comparison.attackRank <= 3) {
    return `⚽ 리그 최강의 공격력! 득점 ${comparison.attackRank}위입니다.`;
  }
  if (comparison.defenseRank <= 3) {
    return `🛡️ 리그 최강의 수비! 실점 ${comparison.defenseRank}위(가장 적게 실점)입니다.`;
  }
  if (outlook.acl1Prob === 'high') {
    return `🎯 ACL 진출권에 안착! 시즌 막판까지 안정적인 흐름입니다.`;
  }
  return `📊 현재 ${team.rank}위, ${form.points}점. ${form.momentumLabel} 페이스를 이어가고 있어요.`;
}
