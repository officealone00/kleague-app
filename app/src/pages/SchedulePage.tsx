import { useEffect, useState } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { api, type ScheduleData, type ScheduleGame, type Meta } from '@/utils/api';
import { getTeam } from '@/data/teams';
import BannerAd from '@/components/BannerAd';
import TeamLogo from '@/components/TeamLogo';

type TabType = 'upcoming' | 'recent';

export default function SchedulePage() {
  const [data, setData] = useState<ScheduleData>({ recent: [], upcoming: [] });
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('upcoming');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([
        api.schedule(),
        api.meta().catch(() => null),
      ]);
      setData(s);
      setMeta(m);
    } catch (e: any) {
      setError(e.message || '로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const list = tab === 'upcoming' ? data.upcoming : data.recent;
  const upcomingCount = data.upcoming.length;
  const recentCount = data.recent.length;

  return (
    <div className="min-h-screen bg-toss-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-end justify-between bg-white">
        <div>
          <h1 className="toss-title text-[26px]">🗓️ K리그 일정</h1>
          <p className="toss-caption mt-1">
            {meta?.updatedAtKST
              ? `${meta.updatedAtKST.split(',')[0]} 업데이트`
              : `${meta?.season || new Date().getFullYear()} 시즌 K리그1`}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-full hover:bg-toss-gray-100"
          aria-label="새로고침"
        >
          <RefreshCw
            size={18}
            className={`text-toss-gray-600 ${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mb-3">
        <div className="bg-white rounded-2xl p-1.5 flex gap-1">
          <TabButton
            label="다음 경기"
            count={upcomingCount}
            active={tab === 'upcoming'}
            onClick={() => setTab('upcoming')}
          />
          <TabButton
            label="전회 결과"
            count={recentCount}
            active={tab === 'recent'}
            onClick={() => setTab('recent')}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 p-4 bg-toss-red/10 rounded-2xl">
          <p className="text-sm text-toss-red font-medium">
            데이터를 불러올 수 없어요
          </p>
          <p className="text-xs text-toss-gray-600 mt-1">{error}</p>
          <button
            onClick={load}
            className="mt-2 text-xs text-toss-blue font-medium"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Game list */}
      <div className="px-5 pb-2">
        <div className="space-y-2">
          {list.map((game, idx) => (
            <GameCard key={`${game.date}-${game.time}-${idx}`} game={game} />
          ))}
        </div>

        {list.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-10 text-center">
            <Calendar size={28} className="mx-auto text-toss-gray-300 mb-2" />
            <p className="text-toss-gray-400 text-sm">
              {tab === 'upcoming'
                ? '예정된 경기가 없어요'
                : '최근 경기 결과가 없어요'}
            </p>
            <p className="text-toss-gray-300 text-xs mt-1">
              데이터 동기화 후 표시돼요
            </p>
          </div>
        )}

        {/* 하단 배너 광고 */}
        {!loading && (
          <div className="mt-4">
            <BannerAd />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-toss-blue text-white shadow-sm'
          : 'bg-transparent text-toss-gray-600'
      }`}
    >
      {label}
      <span
        className={`ml-1.5 text-xs ${
          active ? 'text-white/80' : 'text-toss-gray-400'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function GameCard({ game }: { game: ScheduleGame }) {
  const home = getTeam(game.home);
  const away = getTeam(game.away);
  const isFinished = game.status === 'finished';
  const homeWon =
    isFinished && game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore;
  const awayWon =
    isFinished && game.homeScore !== null && game.awayScore !== null && game.awayScore > game.homeScore;

  return (
    <div className="bg-white rounded-2xl p-4">
      {/* Top row: date · stadium */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-toss-gray-700">
            {formatDate(game.date)}
          </span>
          {game.time && (
            <span className="text-xs text-toss-gray-500">{game.time}</span>
          )}
        </div>
        {game.stadium && (
          <span className="text-[11px] text-toss-gray-400 truncate ml-2">
            {game.stadium}
          </span>
        )}
      </div>

      {/* Match: home vs away */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Home */}
        <div
          className={`flex items-center gap-2 min-w-0 ${
            isFinished && !homeWon ? 'opacity-60' : ''
          }`}
        >
          <TeamLogo team={game.home} size={28} />
          <span
            className="text-sm font-semibold truncate"
            style={{ color: homeWon ? home.color : '#191F28' }}
          >
            {game.home}
          </span>
        </div>

        {/* Score / VS */}
        <div className="text-center px-2 min-w-[60px]">
          {isFinished && game.homeScore !== null && game.awayScore !== null ? (
            <p className="text-lg font-extrabold text-toss-gray-900">
              {game.homeScore}{' '}
              <span className="text-toss-gray-300 font-bold">:</span>{' '}
              {game.awayScore}
            </p>
          ) : (
            <p className="text-xs font-bold text-toss-blue">VS</p>
          )}
        </div>

        {/* Away */}
        <div
          className={`flex items-center gap-2 justify-end min-w-0 ${
            isFinished && !awayWon ? 'opacity-60' : ''
          }`}
        >
          <span
            className="text-sm font-semibold truncate text-right"
            style={{ color: awayWon ? away.color : '#191F28' }}
          >
            {game.away}
          </span>
          <TeamLogo team={game.away} size={28} />
        </div>
      </div>
    </div>
  );
}

// 'YYYY.MM.DD' → 'MM.DD (요일)'
function formatDate(date: string): string {
  if (!date) return '';
  const m = date.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!m) return date;
  const [, , month, day] = m;
  // 요일은 굳이 새로 계산하지 않음 (앱인토스 환경에서 timezone 이슈 회피)
  return `${month}.${day}`;
}
