import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Trophy, Target, Users, Shield, Swords } from 'lucide-react';
import { api, type TeamStanding, type PlayerRecord } from '@/utils/api';
import { getFavoriteTeam } from '@/utils/storage';
import { getTeam } from '@/data/teams';
import { generateTeamReport, type TeamReport } from '@/utils/teamAnalytics';
import RewardedAd from '@/components/RewardedAd';
import BannerAd from '@/components/BannerAd';

export default function TeamReportPage() {
  const navigate = useNavigate();
  const favorite = getFavoriteTeam();
  const [report, setReport] = useState<TeamReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [adShown, setAdShown] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const unlockedRef = useRef(false);

  // 응원팀 없으면 홈으로
  useEffect(() => {
    if (!favorite) {
      navigate('/', { replace: true });
    }
  }, [favorite, navigate]);

  // 데이터 로드 + 리포트 생성
  useEffect(() => {
    if (!favorite) return;
    (async () => {
      try {
        const [standings, scorers, assists] = await Promise.all([
          api.standings(),
          api.scorers().catch(() => null),
          api.assists().catch(() => null),
        ]);
        const r = generateTeamReport(favorite, standings, scorers, assists);
        setReport(r);
      } catch (e) {
        console.warn('[TeamReport] load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [favorite]);

  const handleReward = () => {
    unlockedRef.current = true;
    setUnlocked(true);
  };

  const handleAdClose = () => {
    setAdShown(false);
    if (!unlockedRef.current) {
      navigate('/', { replace: true });
    }
  };

  if (!favorite) return null;

  const info = getTeam(favorite);

  return (
    <div className="min-h-screen bg-toss-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white flex items-center gap-2">
        <button
          onClick={() => navigate('/', { replace: true })}
          className="p-1 -ml-1 rounded-full hover:bg-toss-gray-100"
          aria-label="뒤로"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="toss-title text-[22px]">📊 상세 분석 리포트</h1>
          <p className="toss-caption mt-0.5">{info.fullName}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="px-5 py-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 광고 시청 전 잠금 화면 */}
      {!loading && !unlocked && !adShown && (
        <div className="px-5 py-6">
          <div
            className="rounded-2xl p-6 text-white relative overflow-hidden"
            style={{ backgroundColor: info.color }}
          >
            <div
              className="absolute -right-6 -top-6 opacity-20"
              style={{ fontSize: 120 }}
            >
              {info.emoji}
            </div>
            <div className="relative">
              <p className="text-xs font-semibold opacity-80 mb-1">✨ 프리미엄 리포트</p>
              <p className="text-2xl font-bold mb-2">{info.fullName}</p>
              <p className="text-sm opacity-90 leading-relaxed">
                팀 폼, 순위 전망, TOP 선수,<br />
                리그 평균 비교까지 상세 분석
              </p>
            </div>
          </div>

          {/* 리포트 미리보기 (흐림) */}
          <div className="mt-4 relative">
            <div className="space-y-3 filter blur-md pointer-events-none select-none">
              <MockCard icon="🔥" title="팀 폼 분석" />
              <MockCard icon="🎯" title="순위 전망" />
              <MockCard icon="💪" title="TOP 선수" />
              <MockCard icon="📊" title="리그 평균 비교" />
            </div>

            {/* 중앙 CTA 버튼 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="bg-white rounded-2xl shadow-xl px-6 py-5 text-center max-w-[280px]">
                <p className="text-4xl mb-2">🎬</p>
                <p className="font-bold text-toss-gray-900 mb-1">
                  광고 시청 후 리포트 열람
                </p>
                <p className="text-xs text-toss-gray-600 mb-4 leading-relaxed">
                  짧은 광고 시청하고<br />
                  상세 분석을 확인해보세요
                </p>
                <button
                  onClick={() => setAdShown(true)}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg"
                  style={{ backgroundColor: info.color }}
                >
                  📊 리포트 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 리워드 광고 실행 */}
      {adShown && (
        <RewardedAd onReward={handleReward} onClose={handleAdClose} />
      )}

      {/* 리포트 본문 (광고 시청 완료 후) */}
      {!loading && unlocked && report && (
        <div className="px-5 py-6 pb-10 space-y-4">
          {/* 인사이트 요약 */}
          <div
            className="rounded-2xl p-5 text-white"
            style={{ backgroundColor: info.color }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold opacity-80">💡 핵심 인사이트</span>
            </div>
            <p className="text-base font-bold leading-relaxed">{report.insight}</p>
          </div>

          {/* 1. 팀 폼 */}
          <Card icon={<Trophy size={18} />} title="팀 폼 분석" color={info.color}>
            <div className="space-y-3">
              <TrendRow form={report.form} />

              {/* 모멘텀 바 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-toss-gray-600">모멘텀</span>
                  <span className="text-xs font-bold" style={{ color: info.color }}>
                    {report.form.momentum}점 · {report.form.momentumLabel}
                  </span>
                </div>
                <div className="h-2 bg-toss-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${report.form.momentum}%`,
                      backgroundColor: info.color,
                    }}
                  />
                </div>
              </div>

              {/* 승점/승률 */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <StatBox
                  label="🏆 승점"
                  value={`${report.form.points}점`}
                  good={true}
                />
                <StatBox
                  label="📈 승률"
                  value={`${(report.form.winRate * 100).toFixed(0)}%`}
                  good={report.form.winRate >= 0.5}
                />
              </div>

              <div className="mt-2 p-3 bg-toss-gray-50 rounded-xl">
                <p className="text-xs text-toss-gray-600">
                  최근 5경기: <span className="font-bold text-toss-gray-900">{report.form.last5Record}</span>
                </p>
                {report.form.streakCount >= 2 && (
                  <p className="text-xs text-toss-gray-600 mt-1">
                    현재:{' '}
                    <span
                      className="font-bold"
                      style={{
                        color:
                          report.form.streakType === 'win' ? '#19B377' :
                          report.form.streakType === 'lose' ? '#FF3B30' : '#FF9500',
                      }}
                    >
                      {report.form.streakCount}연
                      {report.form.streakType === 'win' ? '승 🔥' :
                       report.form.streakType === 'lose' ? '패 😢' : '무'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* 2. 순위 전망 */}
          <Card icon={<Target size={18} />} title="순위 전망" color={info.color}>
            <div className="space-y-3">
              <div
                className="rounded-xl p-4 text-center"
                style={{ backgroundColor: info.bgLight }}
              >
                <p className="text-xs text-toss-gray-600 mb-1">현재 순위</p>
                <p
                  className="text-3xl font-extrabold tabular-nums"
                  style={{ color: info.color }}
                >
                  {report.form.rank}위
                </p>
                <p className="text-xs text-toss-gray-600 mt-1">
                  남은 경기 <span className="font-bold">{report.outlook.remainingGames}경기</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <ProbCard label="🏆 우승" prob={report.outlook.championProb} />
                <ProbCard label="🌏 ACL" prob={report.outlook.acl1Prob} />
                <ProbCard label="⚠️ 강등" prob={report.outlook.relegationProb} reverse />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <GapBox
                  label="선두와 격차"
                  gap={report.outlook.pointsBehindLeader}
                  unit="점"
                />
                <GapBox
                  label="강등권과 격차"
                  gap={report.outlook.pointsAheadRelegation}
                  unit="점"
                />
              </div>
            </div>
          </Card>

          {/* 3. TOP 선수 */}
          <Card icon={<Users size={18} />} title="팀 내 TOP 선수" color={info.color}>
            <div className="space-y-2">
              <PlayerRow
                label="⚽ 득점왕"
                player={report.topPlayers.topScorer}
                statLabel={report.topPlayers.topScorer ? `${report.topPlayers.topScorer.goals}골 (리그 ${report.topPlayers.topScorer.rank}위)` : ''}
                color={info.color}
              />
              <PlayerRow
                label="🎯 도움왕"
                player={report.topPlayers.topAssister}
                statLabel={report.topPlayers.topAssister ? `${report.topPlayers.topAssister.assists}도움 (리그 ${report.topPlayers.topAssister.rank}위)` : ''}
                color={info.color}
              />
              <PlayerRow
                label="💎 공격포인트 1위"
                player={report.topPlayers.topAttackPoint}
                statLabel={report.topPlayers.topAttackPoint ? `${report.topPlayers.topAttackPoint.goals}골 ${report.topPlayers.topAttackPoint.assists}도움 = ${report.topPlayers.topAttackPoint.total}P` : ''}
                color={info.color}
              />
            </div>
          </Card>

          {/* 4. 리그 평균 비교 */}
          <Card icon={<Swords size={18} />} title="리그 평균과 비교" color={info.color}>
            <div className="space-y-2.5">
              <CompareRow
                label="승점"
                diff={report.comparison.pointsVsAvg}
                higherIsBetter={true}
              />
              <CompareRow
                label="득점"
                diff={report.comparison.goalsForVsAvg}
                higherIsBetter={true}
              />
              <CompareRow
                label="실점"
                diff={report.comparison.goalsAgainstVsAvg}
                higherIsBetter={false}
              />
              <div className="grid grid-cols-2 gap-2 mt-3">
                <RankBox
                  icon={<Swords size={14} />}
                  label="공격력"
                  rank={report.comparison.attackRank}
                  color={info.color}
                />
                <RankBox
                  icon={<Shield size={14} />}
                  label="수비력"
                  rank={report.comparison.defenseRank}
                  color={info.color}
                />
              </div>
            </div>
          </Card>

          {/* 하단 배너 */}
          <div className="pt-2">
            <BannerAd />
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-3.5 bg-white rounded-xl font-semibold text-sm text-toss-gray-700 mt-2"
          >
            ← 순위로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 하위 컴포넌트들 ───────────────────────

function MockCard({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="font-bold text-toss-gray-900">{title}</p>
        <div className="h-3 bg-toss-gray-100 rounded mt-2 w-3/4" />
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-toss">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <h3 className="font-bold text-toss-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TrendRow({ form }: { form: { trend: 'up' | 'down' | 'steady'; trendLabel: string } }) {
  const Icon = form.trend === 'up' ? TrendingUp : form.trend === 'down' ? TrendingDown : Minus;
  const color = form.trend === 'up' ? '#19B377' : form.trend === 'down' ? '#FF3B30' : '#8B95A1';
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <span className="font-bold text-toss-gray-900">{form.trendLabel}</span>
    </div>
  );
}

function StatBox({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="bg-toss-gray-50 rounded-xl p-3 text-center">
      <p className="text-[11px] text-toss-gray-600 mb-1">{label}</p>
      <p
        className="text-lg font-extrabold tabular-nums"
        style={{ color: good ? '#19B377' : '#FF9500' }}
      >
        {value}
      </p>
    </div>
  );
}

function GapBox({ label, gap, unit }: { label: string; gap: number; unit: string }) {
  return (
    <div className="bg-toss-gray-50 rounded-xl p-2.5 text-center">
      <p className="text-[10px] text-toss-gray-600 mb-0.5">{label}</p>
      <p className="text-base font-extrabold text-toss-gray-900 tabular-nums">
        {gap === 0 ? '-' : `${gap}${unit}`}
      </p>
    </div>
  );
}

function ProbCard({
  label,
  prob,
  reverse = false,
}: {
  label: string;
  prob: 'high' | 'medium' | 'low';
  reverse?: boolean;
}) {
  // reverse=true면 high가 빨강 (ex. 강등 가능성 high = 위험)
  const config = reverse
    ? {
        high: { label: '높음', color: '#FF3B30', bg: '#FFF0EE' },
        medium: { label: '있음', color: '#FF9500', bg: '#FFF4E6' },
        low: { label: '낮음', color: '#19B377', bg: '#E8F8F0' },
      }
    : {
        high: { label: '유력', color: '#19B377', bg: '#E8F8F0' },
        medium: { label: '가능', color: '#FF9500', bg: '#FFF4E6' },
        low: { label: '어려움', color: '#FF3B30', bg: '#FFF0EE' },
      };
  const c = config[prob];
  return (
    <div className="rounded-xl p-2.5 text-center" style={{ backgroundColor: c.bg }}>
      <p className="text-[10px] text-toss-gray-600 mb-0.5">{label}</p>
      <p className="text-sm font-extrabold" style={{ color: c.color }}>
        {c.label}
      </p>
    </div>
  );
}

function PlayerRow({
  label,
  player,
  statLabel,
  color,
}: {
  label: string;
  player: { name: string } | null;
  statLabel: string;
  color: string;
}) {
  if (!player) {
    return (
      <div className="bg-toss-gray-50 rounded-xl p-3">
        <p className="text-[11px] text-toss-gray-500 mb-1">{label}</p>
        <p className="text-sm text-toss-gray-400">기록 없음</p>
      </div>
    );
  }
  return (
    <div className="bg-toss-gray-50 rounded-xl p-3">
      <p className="text-[11px] text-toss-gray-600 mb-1">{label}</p>
      <p className="font-bold text-toss-gray-900 truncate">{player.name}</p>
      <p className="text-xs font-semibold mt-0.5 tabular-nums" style={{ color }}>
        {statLabel}
      </p>
    </div>
  );
}

function CompareRow({
  label,
  diff,
  higherIsBetter,
}: {
  label: string;
  diff: number;
  higherIsBetter: boolean;
}) {
  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const isGood = higherIsBetter ? isPositive : isNegative;
  const color = diff === 0 ? '#8B95A1' : isGood ? '#19B377' : '#FF3B30';
  const sign = isPositive ? '+' : '';
  const labelText = diff === 0 ? '평균' : isGood ? '리그 평균보다 우수' : '리그 평균보다 부족';

  return (
    <div className="flex items-center justify-between p-3 bg-toss-gray-50 rounded-xl">
      <div>
        <p className="text-xs text-toss-gray-600">{label}</p>
        <p className="text-[10px] text-toss-gray-500 mt-0.5">{labelText}</p>
      </div>
      <p className="text-base font-extrabold tabular-nums" style={{ color }}>
        {diff === 0 ? '0' : `${sign}${diff}`}
      </p>
    </div>
  );
}

function RankBox({
  icon,
  label,
  rank,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  rank: number;
  color: string;
}) {
  return (
    <div className="bg-toss-gray-50 rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-base font-extrabold tabular-nums" style={{ color }}>
        리그 {rank}위
      </p>
    </div>
  );
}
