import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { type PlayerRecord, type Meta } from '@/utils/api';
import { getTeam } from '@/data/teams';
import BannerAd from '@/components/BannerAd';
import TeamLogo from '@/components/TeamLogo';

interface Props {
  title: string;          // 헤더 제목 (예: '득점 순위')
  emoji: string;
  primaryLabel: string;   // 주요 컬럼 라벨 (예: '골', '도움')
  primaryKey: keyof Pick<PlayerRecord, 'goals' | 'assists'>;
  secondaryLabel: string; // 보조 컬럼 라벨 (예: '도움', '골')
  secondaryKey: keyof Pick<PlayerRecord, 'goals' | 'assists'>;
  loadFn: () => Promise<PlayerRecord[]>;
  metaFn: () => Promise<Meta | null>;
  emptyMessage: string;
}

export default function PlayerListPage({
  title,
  emoji,
  primaryLabel,
  primaryKey,
  secondaryLabel,
  secondaryKey,
  loadFn,
  metaFn,
  emptyMessage,
}: Props) {
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, m] = await Promise.all([loadFn(), metaFn()]);
      setPlayers(list);
      setMeta(m);
    } catch (e: any) {
      setError(e.message || '로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-toss-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-end justify-between bg-white">
        <div>
          <h1 className="toss-title text-[26px]">
            {emoji} {title}
          </h1>
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

      {/* Player list */}
      <div className="px-5 pb-2">
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[28px_1fr_44px_44px_44px] gap-1 px-3 py-2.5 border-b border-toss-gray-100 text-[11px] font-semibold text-toss-gray-500">
            <span className="text-center">#</span>
            <span>선수</span>
            <span className="text-center">{primaryLabel}</span>
            <span className="text-center">{secondaryLabel}</span>
            <span className="text-center">출장</span>
          </div>

          {players.map((p) => {
            const team = getTeam(p.team);
            return (
              <div
                key={`${p.rank}-${p.name}-${p.teamId}`}
                className="grid grid-cols-[28px_1fr_44px_44px_44px] gap-1 items-center px-3 py-2.5 border-b border-toss-gray-50 last:border-0"
              >
                <span
                  className="text-center font-bold text-sm"
                  style={{ color: p.rank <= 3 ? team.color : '#191F28' }}
                >
                  {p.rank}
                </span>
                <span className="flex items-center gap-2 min-w-0">
                  <TeamLogo team={p.team} size={20} />
                  <span className="min-w-0">
                    <p className="text-sm font-semibold text-toss-gray-900 truncate">
                      {p.name}
                    </p>
                    <p
                      className="text-[10px] truncate"
                      style={{ color: team.color }}
                    >
                      {p.team}
                    </p>
                  </span>
                </span>
                <span
                  className="text-center font-extrabold text-base"
                  style={{ color: '#3182F6' }}
                >
                  {p[primaryKey] as number}
                </span>
                <span className="text-center text-xs text-toss-gray-700">
                  {p[secondaryKey] as number}
                </span>
                <span className="text-center text-xs text-toss-gray-500">
                  {p.games}
                </span>
              </div>
            );
          })}

          {players.length === 0 && !loading && (
            <div className="p-10 text-center text-toss-gray-400 text-sm">
              {emptyMessage}
            </div>
          )}
        </div>

        {!loading && (
          <div className="mt-4">
            <BannerAd />
          </div>
        )}
      </div>
    </div>
  );
}
