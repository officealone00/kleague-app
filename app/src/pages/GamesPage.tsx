import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api, type GamesData, type Game } from '@/utils/api';
import { getTeam } from '@/data/teams';
import { getFavoriteTeam } from '@/utils/storage';
import BannerAd from '@/components/BannerAd';
import TeamLogo from '@/components/TeamLogo';

export default function GamesPage() {
  const [games, setGames] = useState<GamesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'today' | 'yesterday'>('today');
  const favorite = getFavoriteTeam();

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.games();
      setGames(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const current = games?.[tab];
  const dateLabel = tab === 'today' ? '오늘 경기' : '어제 경기';

  const fmtDate = (d: string) => {
    if (!d || d.length !== 8) return '';
    return `${d.slice(4, 6)}.${d.slice(6, 8)}`;
  };

  return (
    <div className="min-h-screen bg-toss-gray-50">
      <div className="px-5 pt-14 pb-4 flex items-end justify-between bg-white">
        <div>
          <h1 className="toss-title text-[26px]">📅 경기</h1>
          <p className="toss-caption mt-1">
            {current?.date ? fmtDate(current.date) : dateLabel}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-full hover:bg-toss-gray-100"
          aria-label="새로고침"
        >
          <RefreshCw size={18} className={`text-toss-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 탭 */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex gap-2 bg-white rounded-xl p-1">
          <button
            onClick={() => setTab('today')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'today' ? 'bg-toss-blue text-white' : 'text-toss-gray-600'
            }`}
          >
            오늘 경기
          </button>
          <button
            onClick={() => setTab('yesterday')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'yesterday' ? 'bg-toss-blue text-white' : 'text-toss-gray-600'
            }`}
          >
            어제 경기
          </button>
        </div>
      </div>

      {/* 🎯 배너 #1 - 탭 아래 */}
      <div className="px-5 pt-2 pb-3">
        <BannerAd />
      </div>

      {loading && !games && (
        <div className="px-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl mb-2 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && current && current.games.length === 0 && (
        <div className="px-5 py-10 text-center">
          <p className="text-4xl mb-2">⚽</p>
          <p className="text-toss-gray-500">{dateLabel}가 없어요</p>
        </div>
      )}

      {!loading && current && current.games.length > 0 && (
        <div className="px-5 pb-4 space-y-3">
          {current.games.map((g, idx) => (
            <div key={idx}>
              <GameCard game={g} favorite={favorite} />

              {/* 🎯 배너 #2 - 3번째 경기 후 */}
              {idx === 2 && <div className="pt-2"><BannerAd /></div>}
            </div>
          ))}
        </div>
      )}

      {/* 🎯 배너 #3 - 페이지 하단 */}
      <div className="px-5 pb-6">
        <BannerAd />
      </div>
    </div>
  );
}

function GameCard({ game, favorite }: { game: Game; favorite: string | null }) {
  const home = getTeam(game.home);
  const away = getTeam(game.away);
  const isDone = game.status === '종료' || (game.homeScore !== null && game.awayScore !== null);
  const isLive = game.status === '진행' || game.status === 'live';
  const hasFav = game.home === favorite || game.away === favorite;

  return (
    <div
      className="bg-white rounded-toss shadow-toss p-4"
      style={hasFav ? { border: `2px solid ${getTeam(favorite || '').color}` } : {}}
    >
      {/* 상단: 시간/상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {game.time && (
            <span className="text-xs font-semibold text-toss-gray-500">
              {game.time}
            </span>
          )}
          {isLive && (
            <span className="px-2 py-0.5 bg-toss-red text-white text-[10px] font-bold rounded-full animate-pulse">
              LIVE
            </span>
          )}
          {isDone && (
            <span className="px-2 py-0.5 bg-toss-gray-100 text-toss-gray-600 text-[10px] font-bold rounded-full">
              종료
            </span>
          )}
          {!isDone && !isLive && (
            <span className="px-2 py-0.5 bg-toss-blue/10 text-toss-blue text-[10px] font-bold rounded-full">
              예정
            </span>
          )}
        </div>
        {game.stadium && (
          <span className="text-[10px] text-toss-gray-500">📍 {game.stadium}</span>
        )}
      </div>

      {/* 경기 내용 */}
      <div className="flex items-center justify-between gap-3">
        {/* 홈팀 */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <TeamLogo team={game.home} size={32} />
          <div className="min-w-0">
            <p
              className="font-bold text-sm truncate"
              style={{ color: game.home === favorite ? home.color : '#191F28' }}
            >
              {home.name}
            </p>
            <p className="text-[10px] text-toss-gray-500">홈</p>
          </div>
        </div>

        {/* 스코어 */}
        <div className="text-center px-3">
          {isDone || isLive ? (
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-extrabold tabular-nums"
                style={{
                  color:
                    (game.homeScore ?? 0) > (game.awayScore ?? 0)
                      ? home.color
                      : '#191F28',
                }}
              >
                {game.homeScore}
              </span>
              <span className="text-toss-gray-400 text-lg">:</span>
              <span
                className="text-2xl font-extrabold tabular-nums"
                style={{
                  color:
                    (game.awayScore ?? 0) > (game.homeScore ?? 0)
                      ? away.color
                      : '#191F28',
                }}
              >
                {game.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-toss-gray-400">VS</span>
          )}
        </div>

        {/* 원정팀 */}
        <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
          <div className="min-w-0 text-right">
            <p
              className="font-bold text-sm truncate"
              style={{ color: game.away === favorite ? away.color : '#191F28' }}
            >
              {away.name}
            </p>
            <p className="text-[10px] text-toss-gray-500">원정</p>
          </div>
          <TeamLogo team={game.away} size={32} />
        </div>
      </div>
    </div>
  );
}
