import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api, type Player } from '@/utils/api';
import { getTeam } from '@/data/teams';
import { getFavoriteTeam } from '@/utils/storage';
import BannerAd from '@/components/BannerAd';
import TeamLogo from '@/components/TeamLogo';

export default function AssistsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const favorite = getFavoriteTeam();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.assists();
      setPlayers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-toss-gray-50">
      <div className="px-5 pt-14 pb-4 flex items-end justify-between bg-white">
        <div>
          <h1 className="toss-title text-[26px]">🎯 도움왕</h1>
          <p className="toss-caption mt-1">K리그1 도움 순위 TOP 30</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-full hover:bg-toss-gray-100"
          aria-label="새로고침"
        >
          <RefreshCw size={18} className={`text-toss-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-3">
        <BannerAd />
      </div>

      {loading && !players.length && (
        <div className="px-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl mb-2 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && players.length === 0 && (
        <div className="px-5 py-10 text-center">
          <p className="text-toss-gray-500">아직 도움 순위 데이터가 없어요</p>
        </div>
      )}

      {!loading && players.length > 0 && (
        <div className="px-5 pb-4">
          <div className="bg-white rounded-toss shadow-toss overflow-hidden">
            <div
              className="grid items-center text-[11px] font-semibold text-toss-gray-500 px-3 py-2 bg-toss-gray-50 border-b border-toss-gray-100"
              style={{ gridTemplateColumns: '36px 1fr 32px 32px 32px' }}
            >
              <span className="text-center">순위</span>
              <span>선수 · 팀</span>
              <span className="text-right">경기</span>
              <span className="text-right">골</span>
              <span className="text-right">도움</span>
            </div>

            {players.map((p, idx) => {
              const info = getTeam(p.team);
              const isFav = p.team === favorite;
              return (
                <div key={`${p.name}-${idx}`}>
                  <div
                    className="grid items-center px-3 py-3 border-b border-toss-gray-100 last:border-b-0"
                    style={{
                      gridTemplateColumns: '36px 1fr 32px 32px 32px',
                      backgroundColor: isFav ? info.bgLight : 'transparent',
                    }}
                  >
                    <div className="text-center">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: p.rank <= 3 ? info.color : '#E5E8EB',
                          color: p.rank <= 3 ? 'white' : '#8B95A1',
                        }}
                      >
                        {p.rank}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo team={p.team} size={24} />
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: isFav ? info.color : '#191F28' }}>
                          {p.name} {isFav && '❤️'}
                        </p>
                        <p className="text-[11px] text-toss-gray-500 truncate">
                          {p.team} · {p.position || '선수'}
                        </p>
                      </div>
                    </div>
                    <span className="text-right text-sm text-toss-gray-600 tabular-nums">{p.games}</span>
                    <span className="text-right text-sm text-toss-gray-600 tabular-nums">{p.goals}</span>
                    <span className="text-right text-base font-extrabold tabular-nums" style={{ color: info.color }}>
                      {p.assists}
                    </span>
                  </div>

                  {idx === 4 && (
                    <div className="px-3 py-3 bg-toss-gray-50 border-b border-toss-gray-100">
                      <BannerAd />
                    </div>
                  )}

                  {idx === 14 && (
                    <div className="px-3 py-3 bg-toss-gray-50 border-b border-toss-gray-100">
                      <BannerAd />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-5 pb-6">
        <BannerAd />
      </div>
    </div>
  );
}
