/**
 * 파이널 A(1~6위) 경쟁 계산기 (2026-10-19)
 *
 * 2026 K리그1 대회요강: 정규 라운드 33경기 후 1~6위 그룹A, 7~12위 그룹B.
 * 순위 결정: 승점 → 다득점 → 득실차 → …
 *
 * 남은 정규 라운드 경기의 모든 결과(홈승/무/원정승)를 하나씩 따져서
 * 팀마다 "확정 / 경쟁 중 / 탈락"과 이기면·비기면·지면 어떻게 되는지 계산해요.
 * 골 수는 알 수 없어서, 승점이 같아 6위가 갈리는 경우는 '다득점 비교'로 따로 표시해요.
 * 결과를 예측하지 않아요 — 가능한 모든 경우를 셀 뿐이에요.
 */
import type { ScheduleGame, TeamStanding } from './api';

export const REGULAR_ROUNDS = 33;
export const CUT = 6;

type R = 'H' | 'D' | 'A';
export type Fate = 'in' | 'out' | 'tie';

export interface RaceMatch {
  home: string;
  away: string;
  date: string;
  time: string;
}

export interface TeamCase {
  /** 이 결과일 때: 언제나 진출 / 언제나 탈락 / 다른 경기·다득점에 따라 */
  verdict: 'in' | 'out' | 'depends';
  /** 'depends'일 때 화면에 그대로 보여 줄 문장 (예: "대전이 지면 진출 · 대전이 이기면 다득점(→득실차) 비교") */
  condition?: string;
  /** 승점이 같아질 때 맞대결 결과로 다득점 앞뒤가 정해지는 경우의 설명 */
  note?: string;
  /** 승점이 같아 다득점으로 갈리는 경우가 있는지 */
  tieBreak?: boolean;
  inCount: number;
  total: number;
}

export interface TeamRace {
  team: string;
  points: number;
  goalsFor: number;
  remaining: number;
  status: 'in' | 'out' | 'alive';
  /** 팀의 남은 경기 (1경기일 때) */
  match?: RaceMatch;
  opponent?: string;
  cases?: { W: TeamCase; D: TeamCase; L: TeamCase };
}

export interface SplitRace {
  /** 정규 라운드가 이미 끝났는지 */
  finished: boolean;
  matches: RaceMatch[];
  teams: TeamRace[];
  /** 계산할 수 없는 상태 (남은 경기가 너무 많거나 일정이 부족) */
  unavailable?: string;
}

/**
 * 승점이 같을 때 확실히 아는 경우 하나: 남은 경기에서 직접 맞붙어 이긴 팀은
 * 지금 다득점이 같거나 많으면 다득점에서도 반드시 앞서요 (이긴 경기에서 더 많이 넣었으니까요).
 */
function fateOf(team: string, pts: Record<string, number>, gf: Record<string, number>, beat: Set<string>): Fate {
  const p = pts[team];
  let above = 0;
  let equal = 0;
  let surelyAhead = 0; // 승점 같은데 확실히 앞서는 상대
  let surelyBehind = 0; // 승점 같은데 확실히 뒤지는 상대
  for (const t in pts) {
    if (t === team) continue;
    if (pts[t] > p) above++;
    else if (pts[t] === p) {
      equal++;
      if (beat.has(`${t}>${team}`) && gf[t] >= gf[team]) surelyAhead++;
      else if (beat.has(`${team}>${t}`) && gf[team] >= gf[t]) surelyBehind++;
    }
  }
  if (above + equal - surelyBehind < CUT) return 'in';
  if (above + surelyAhead >= CUT) return 'out';
  return 'tie';
}

const hasJong = (w: string) => {
  const c = w.charCodeAt(w.length - 1);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 > 0;
};
/** 받침에 맞춰 과/와 */
export const gwa = (w: string) => `${w}${hasJong(w) ? '과' : '와'}`;
/** 받침에 맞춰 이/가 */
export const iga = (w: string) => {
  const c = w.charCodeAt(w.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return `${w}가`;
  return (c - 0xac00) % 28 ? `${w}이` : `${w}가`;
};

export function computeSplitRace(standings: TeamStanding[], upcoming: ScheduleGame[]): SplitRace {
  const remainingOf = (t: TeamStanding) => Math.max(0, REGULAR_ROUNDS - t.games);
  if (standings.length < 12) return { finished: false, matches: [], teams: [], unavailable: '순위를 불러오지 못했어요' };
  if (standings.every((t) => remainingOf(t) === 0)) return { finished: true, matches: [], teams: [] };

  // 남은 정규 라운드 경기: 두 팀 모두 33경기를 다 치르지 않은 예정 경기를 앞에서부터
  const left: Record<string, number> = Object.fromEntries(standings.map((t) => [t.team, remainingOf(t)]));
  const matches: RaceMatch[] = [];
  for (const g of upcoming) {
    if (g.status !== 'scheduled') continue;
    if ((left[g.home] ?? 0) > 0 && (left[g.away] ?? 0) > 0) {
      matches.push({ home: g.home, away: g.away, date: g.date, time: g.time });
      left[g.home]--;
      left[g.away]--;
    }
  }
  const missing = Object.values(left).some((n) => n > 0);
  if (missing) return { finished: false, matches, teams: [], unavailable: '남은 일정이 아직 다 나오지 않았어요' };
  if (matches.length > 9) return { finished: false, matches, teams: [], unavailable: '남은 경기가 많아 아직 계산하지 않아요' };

  const base: Record<string, number> = Object.fromEntries(standings.map((t) => [t.team, t.points]));
  const gf: Record<string, number> = Object.fromEntries(standings.map((t) => [t.team, t.goalsFor]));
  const n = matches.length;
  const total = 3 ** n;
  // 모든 경우: 결과 배열 + 팀별 운명
  const outcomes: { res: R[]; fate: Record<string, Fate> }[] = [];
  for (let k = 0; k < total; k++) {
    let x = k;
    const res: R[] = [];
    const pts = { ...base };
    const beat = new Set<string>();
    for (let i = 0; i < n; i++) {
      const r = (['H', 'D', 'A'] as R[])[x % 3];
      x = Math.floor(x / 3);
      res.push(r);
      const m = matches[i];
      if (r === 'H') {
        pts[m.home] += 3;
        beat.add(`${m.home}>${m.away}`);
      } else if (r === 'A') {
        pts[m.away] += 3;
        beat.add(`${m.away}>${m.home}`);
      }
      else {
        pts[m.home] += 1;
        pts[m.away] += 1;
      }
    }
    const fate: Record<string, Fate> = {};
    for (const t in pts) fate[t] = fateOf(t, pts, gf, beat);
    outcomes.push({ res, fate });
  }

  const alive = new Set(
    standings.map((t) => t.team).filter((t) => {
      const fs = outcomes.map((o) => o.fate[t]);
      return !(fs.every((f) => f === 'in') || fs.every((f) => f === 'out'));
    }),
  );

  const resultFor = (team: string, m: RaceMatch, r: R): 'W' | 'D' | 'L' =>
    r === 'D' ? 'D' : (r === 'H') === (m.home === team) ? 'W' : 'L';

  const describe = (team: string, oi: number, want: 'W' | 'D' | 'L'): TeamCase => {
    const set = outcomes.filter((o) => resultFor(team, matches[oi], o.res[oi]) === want);
    const ins = set.filter((o) => o.fate[team] === 'in').length;
    const outs = set.filter((o) => o.fate[team] === 'out').length;
    const ties = set.length - ins - outs;
    // 맞대결 상대와 승점이 같아지는 경우: 이긴 팀이 그 경기에서 더 넣었으니, 지금 다득점이 같거나 많으면 다득점에서도 앞서요
    const m0 = matches[oi];
    const opp = m0.home === team ? m0.away : m0.home;
    let note: string | undefined;
    if (want === 'L' && base[opp] + 3 === base[team] && gf[opp] >= gf[team])
      note = `${gwa(opp)} 승점이 같아져도, 맞대결에서 더 넣은 ${iga(opp)} 다득점에서 앞서요 (지금 ${opp} ${gf[opp]}골 · ${team} ${gf[team]}골)`;
    if (want === 'W' && base[team] + 3 === base[opp] && gf[team] >= gf[opp])
      note = `${gwa(opp)} 승점이 같아져도, 맞대결에서 더 넣은 만큼 다득점에서 앞서요`;
    if (ins === set.length) return { verdict: 'in', note, inCount: ins, total: set.length };
    if (outs === set.length) return { verdict: 'out', note, inCount: 0, total: set.length };
    const TB = '다득점(→득실차) 비교';
    const restWord = (rest: typeof set) =>
      rest.every((o) => o.fate[team] === 'out')
        ? '탈락'
        : rest.every((o) => o.fate[team] === 'tie')
          ? TB
          : rest.some((o) => o.fate[team] === 'in')
            ? '다른 경기 결과에 따라'
            : `${TB} 또는 탈락`;
    const ALL: R[] = ['H', 'D', 'A'];
    const compl = (sub: R[]) => ALL.filter((r) => !sub.includes(r));
    // 다른 한 경기만 보면 확정되는 조건 찾기
    let condition: string | undefined;
    const label = (m: RaceMatch, rs: R[]) => {
      // 그 경기에서 아직 경쟁 중인 팀(없으면 홈 팀) 기준으로 말해요: "제주가 지거나 비기면"
      const subj = alive.has(m.home) ? m.home : alive.has(m.away) ? m.away : m.home;
      const word = (r: R) => (r === 'D' ? '비기' : (r === 'H') === (subj === m.home) ? '이기' : '지');
      const order = ['이기', '비기', '지'];
      const ws = [...new Set(rs.map(word))].sort((x, y) => order.indexOf(x) - order.indexOf(y));
      return `${iga(subj)} ${ws.join('거나 ')}면`;
    };
    outer: for (let j = 0; j < n; j++) {
      if (j === oi) continue;
      const subsets: R[][] = [['H', 'D'], ['D', 'A'], ['H', 'A'], ['H'], ['D'], ['A']];
      for (const sub of subsets) {
        const s2 = set.filter((o) => sub.includes(o.res[j]));
        if (s2.length && s2.every((o) => o.fate[team] === 'in')) {
          const rest = set.filter((o) => !sub.includes(o.res[j]));
          if (rest.some((o) => o.fate[team] !== 'in')) {
            condition = `${label(matches[j], sub)} 진출 · ${label(matches[j], compl(sub))} ${restWord(rest)}`;
            break outer;
          }
        }
      }
    }
    // 진출이 확정되는 조건이 없으면: "이 경기가 이렇게 끝나야만 다득점으로 가려져요"
    if (!condition) {
      outer2: for (let j = 0; j < n; j++) {
        if (j === oi) continue;
        for (const sub of [['H'], ['D'], ['A'], ['H', 'D'], ['D', 'A'], ['H', 'A']] as R[][]) {
          const outside = set.filter((o) => !sub.includes(o.res[j]));
          const inside = set.filter((o) => sub.includes(o.res[j]));
          if (inside.length && outside.every((o) => o.fate[team] === 'out') && inside.some((o) => o.fate[team] !== 'out')) {
            condition = `${label(matches[j], compl(sub))} 탈락 · ${label(matches[j], sub)} ${restWord(inside)}`;
            break outer2;
          }
        }
      }
    }
    return { verdict: 'depends', condition, note, tieBreak: ties > 0, inCount: ins, total: set.length };
  };

  const teams: TeamRace[] = standings.map((t) => {
    const fates = outcomes.map((o) => o.fate[t.team]);
    const status: TeamRace['status'] = fates.every((f) => f === 'in') ? 'in' : fates.every((f) => f === 'out') ? 'out' : 'alive';
    const mi = matches.findIndex((m) => m.home === t.team || m.away === t.team);
    const row: TeamRace = { team: t.team, points: t.points, goalsFor: t.goalsFor, remaining: remainingOf(t), status };
    if (mi >= 0) {
      row.match = matches[mi];
      row.opponent = matches[mi].home === t.team ? matches[mi].away : matches[mi].home;
      // 남은 경기가 1경기인 팀만 이기면/비기면/지면 표를 만들어요
      if (status === 'alive' && matches.filter((m) => m.home === t.team || m.away === t.team).length === 1) {
        row.cases = { W: describe(t.team, mi, 'W'), D: describe(t.team, mi, 'D'), L: describe(t.team, mi, 'L') };
      }
    }
    return row;
  });

  return { finished: false, matches, teams };
}
