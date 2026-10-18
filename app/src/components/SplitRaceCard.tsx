/**
 * 🔥 파이널 A 진출 경쟁 카드 (2026-10-19)
 * - 확정 / 경쟁 중 / 탈락 표시, 결정적 경기는 무료
 * - 팀별 "이기면·비기면·지면" 경우의 수는
 *   [광고 보고 경우의 수 보기] → "짧은 광고를 볼까요?" → [광고 보기]를 눌러야만 광고가 나와요.
 *   끝까지 보면 오늘 하루 열려요. 광고를 불러올 수 없으면 그냥 열어 줘요.
 */
import { useEffect, useMemo, useState } from 'react';
import { api, type ScheduleData, type TeamStanding } from '@/utils/api';
import { computeSplitRace, type TeamCase, type TeamRace } from '@/utils/splitRace';
import { getTeam } from '@/data/teams';
import { ConfirmSheet } from '@/components/BottomSheet';
import RewardedAd, { preloadReportAd } from '@/components/RewardedAd';
import { logEvent } from '@/utils/tossGrowth';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const fmt = (d: string, t: string) => {
  const [y, m, day] = d.split('.').map(Number);
  return `${m}.${day} (${DOW[new Date(y, m - 1, day).getDay()]}) ${t}`;
};
const unlockKey = () => `kl-split-unlock-${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)}`;
const readUnlock = () => {
  try {
    return localStorage.getItem(unlockKey()) === '1';
  } catch {
    return false;
  }
};

export default function SplitRaceCard({ standings }: { standings: TeamStanding[] }) {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [unlocked, setUnlocked] = useState(readUnlock);
  const [ask, setAsk] = useState(false);
  const [adShown, setAdShown] = useState(false);

  useEffect(() => {
    void api.schedule().then(setSchedule);
  }, []);

  const race = useMemo(
    () => (schedule && standings.length ? computeSplitRace(standings, schedule.upcoming) : null),
    [schedule, standings],
  );

  useEffect(() => {
    if (race && !race.finished && !race.unavailable && !unlocked) preloadReportAd();
  }, [race, unlocked]);

  if (!race) return null;

  // 정규 라운드가 끝났으면 그룹만 보여줘요
  if (race.finished) {
    const sorted = [...standings].sort((a, b) => a.rank - b.rank);
    return (
      <div className="bg-white rounded-2xl p-4">
        <p className="font-bold text-toss-gray-900 mb-2">🏆 파이널 라운드 (34~38라운드)</p>
        <Group title="파이널 A · 우승 경쟁" teams={sorted.slice(0, 6).map((t) => t.team)} />
        <Group title="파이널 B · 잔류 경쟁" teams={sorted.slice(6).map((t) => t.team)} />
      </div>
    );
  }
  if (race.unavailable || race.matches.length === 0) return null;

  const by = (s: TeamRace['status']) => race.teams.filter((t) => t.status === s);
  const alive = by('alive');
  if (alive.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4">
        <p className="font-bold text-toss-gray-900 mb-2">🏆 파이널 A 6팀 확정</p>
        <Group title="파이널 A" teams={by('in').map((t) => t.team)} />
      </div>
    );
  }
  const keyMatches = race.matches.filter((m) => alive.some((t) => t.team === m.home || t.team === m.away));
  const firstDate = race.matches[0];

  return (
    <div className="rounded-2xl overflow-hidden bg-white">
      <div className="px-4 pt-4 pb-3" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F04452 100%)' }}>
        <p className="text-white/90 text-[12px] font-semibold">정규 라운드 마지막 {race.matches.length}경기 · {fmt(firstDate.date, firstDate.time)}~</p>
        <p className="text-white text-[18px] font-bold mt-0.5">🔥 파이널 A 남은 {6 - by('in').length}자리</p>
      </div>
      <div className="p-4 space-y-2.5">
        <Row label="확정" color="#3182F6" teams={by('in').map((t) => t.team)} />
        <Row label="경쟁 중" color="#F04452" teams={alive.map((t) => `${t.team} ${t.points}점`)} />
        <Row label="파이널 B" color="#8B95A1" teams={by('out').map((t) => t.team)} />

        <div className="mt-2 rounded-xl bg-toss-gray-50 p-3">
          <p className="text-[12px] font-bold text-toss-gray-600 mb-1">결정적 경기</p>
          {keyMatches.map((m) => (
            <p key={m.home + m.away} className="text-[14px] text-toss-gray-900">
              <b>{m.home}</b> vs <b>{m.away}</b> <span className="text-toss-gray-500 text-[12px]">{fmt(m.date, m.time)}</span>
            </p>
          ))}
        </div>

        {unlocked ? (
          <div className="space-y-2 pt-1">
            {alive.map((t) => (
              <CaseTable key={t.team} t={t} />
            ))}
            <p className="text-[12px] text-toss-gray-500 leading-relaxed">
              지금 다득점: {alive.map((t) => `${t.team} ${t.goalsFor}골`).join(' · ')}
              <br />
              승점이 같으면 다득점 → 득실차 순으로 가려요 (2026 K리그1 대회요강). 가능한 모든 결과를 셌을 뿐, 결과를 예측하지 않아요.
            </p>
          </div>
        ) : (
          <div className="relative rounded-xl border border-toss-gray-100 p-3">
            <div className="space-y-2 blur-sm select-none pointer-events-none" aria-hidden>
              <div className="h-4 w-2/3 rounded bg-toss-gray-200" />
              <div className="h-10 rounded-lg bg-toss-gray-100" />
              <div className="h-10 rounded-lg bg-toss-gray-100" />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <p className="text-[13px] font-semibold text-toss-gray-800">팀별로 이기면·비기면·지면 어떻게 되는지</p>
              <button
                type="button"
                onClick={() => setAsk(true)}
                className="mt-2 w-full max-w-[260px] rounded-xl bg-toss-blue py-3 text-[15px] font-bold text-white"
              >
                광고 보고 경우의 수 보기
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmSheet
        open={ask}
        desc={'짧은 광고를 끝까지 보면\n오늘 하루 팀별 경우의 수를 볼 수 있어요.'}
        onClose={() => setAsk(false)}
        onConfirm={() => {
          setAsk(false);
          setAdShown(true);
        }}
      />
      {adShown && (
        <RewardedAd
          onReward={() => {
            try {
              localStorage.setItem(unlockKey(), '1');
            } catch {
              /* noop */
            }
            setUnlocked(true);
            logEvent('split_cases_unlocked', {});
          }}
          onClose={() => setAdShown(false)}
        />
      )}
    </div>
  );
}

function Row({ label, color, teams }: { label: string; color: string; teams: string[] }) {
  if (!teams.length) return null;
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 w-[58px] text-[12px] font-bold pt-0.5" style={{ color }}>
        {label}
      </span>
      <span className="text-[14px] text-toss-gray-800 leading-relaxed">{teams.join(' · ')}</span>
    </div>
  );
}

function Group({ title, teams }: { title: string; teams: string[] }) {
  return (
    <div className="mb-2">
      <p className="text-[12px] font-bold text-toss-gray-600">{title}</p>
      <p className="text-[14px] text-toss-gray-900">{teams.join(' · ')}</p>
    </div>
  );
}

function caseText(c: TeamCase) {
  if (c.verdict === 'in') return { text: '진출 확정', color: '#3182F6' };
  if (c.verdict === 'out') return { text: '탈락', color: '#8B95A1' };
  if (c.condition) return { text: c.condition, color: '#F04452' };
  return { text: c.tieBreak ? '다득점(→득실차)으로 가려져요' : '다른 경기 결과에 따라', color: '#F04452' };
}

function CaseTable({ t }: { t: TeamRace }) {
  const info = getTeam(t.team);
  if (!t.cases) return null;
  return (
    <div className="rounded-xl border border-toss-gray-100 p-3">
      <p className="font-bold text-[15px]" style={{ color: info.color }}>
        {t.team} <span className="text-toss-gray-500 text-[12px] font-medium">{t.points}점 · 상대 {t.opponent}</span>
      </p>
      {(['W', 'D', 'L'] as const).map((k) => {
        const c = caseText(t.cases![k]);
        return (
          <div key={k} className="flex items-start gap-2 mt-1.5 text-[14px]">
            <span className="shrink-0 w-12 whitespace-nowrap text-toss-gray-600">{k === 'W' ? '이기면' : k === 'D' ? '비기면' : '지면'}</span>
            <span className="min-w-0">
              <span className="font-semibold" style={{ color: c.color }}>
                {c.text}
              </span>
              {t.cases![k].note && <span className="block text-[12px] text-toss-gray-500 mt-0.5">{t.cases![k].note}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

