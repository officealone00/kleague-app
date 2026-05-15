import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Settings, RefreshCw } from 'lucide-react';
import { api, type TeamStanding, type Meta } from '@/utils/api';
import { getFavoriteTeam, setFavoriteTeam } from '@/utils/storage';
import { getTeam } from '@/data/teams';
import BannerAd from '@/components/BannerAd';
import FavoriteTeamModal from '@/components/FavoriteTeamModal';
import TeamLogo from '@/components/TeamLogo';

export default function StandingsPage() {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState<string | null>(getFavoriteTeam());
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m] = await Promise.all([
        api.standings(),
        api.meta().catch(() => null),
      ]);
      setStandings(s);
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

  const handleFavoriteSelect = (team: string | null) => {
    setFavorite(team);
    setFavoriteTeam(team);
  };

  return (
    <div className="min-h-screen bg-toss-gray-50">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-end justify-between bg-white">
        <div>
          <h1 className="toss-title text-[26px]">⚽ K리그 순위</h1>
          <p className="toss-caption mt-1">
            {meta?.updatedAtKST
              ? `${meta.updatedAtKST.split(',')[0]} 업데이트`
              : `${meta?.season || new Date().getFullYear()} 시즌 K리그1`}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowModal(true)}
            className="p-2 rounded-full hover:bg-toss-gray-100"
            aria-label="즐겨찾기 팀 설정"
          >
            {favorite ? (
              <Heart size={18} className="text-toss-red" fill="#FF3B30" />
            ) : (
              <Settings size={18} className="text-toss-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* 즐겨찾기 카드 */}
      {favorite && (
        <div className="px-5 mb-3 mt-2">
          <FavoriteTeamCard
            team={favorite}
            standings={standings}
            onReportClick={() => navigate('/team-report')}
          />
        </div>
      )}

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

      {/* Standings Table */}
      <div className="px-5 pb-2">
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[28px_1fr_28px_28px_36px_36px_36px] gap-1 px-3 py-2.5 border-b border-toss-gray-100 text-[11px] font-semibold text-toss-gray-500">
            <span className="text-center">#</span>
            <span>팀</span>
            <span className="text-center">경기</span>
            <span className="text-center">승점</span>
            <span className="text-center">승</span>
            <span className="text-center">무</span>
            <span className="text-center">패</span>
          </div>

          {/* Rows */}
          {standings.map((row) => {
            const team = getTeam(row.team);
            const isFav = favorite === row.team;
            return (
              <div
                key={row.teamId || row.team}
                className="grid grid-cols-[28px_1fr_28px_28px_36px_36px_36px] gap-1 items-center px-3 py-2.5 border-b border-toss-gray-50 last:border-0"
                style={
                  isFav
                    ? { backgroundColor: team.bgLight }
                    : undefined
                }
              >
                <span
                  className="text-center font-bold text-sm"
                  style={{ color: row.rank <= 3 ? team.color : '#191F28' }}
                >
                  {row.rank}
                </span>
                <span className="flex items-center gap-2 min-w-0">
                  <TeamLogo team={row.team} size={22} />
                  <span
                    className={`text-sm truncate ${
                      isFav ? 'font-bold' : 'font-semibold'
                    }`}
                    style={{ color: isFav ? team.color : '#191F28' }}
                  >
                    {row.team}
                  </span>
                </span>
                <span className="text-center text-xs text-toss-gray-500">
                  {row.games}
                </span>
                <span
                  className="text-center font-extrabold text-sm"
                  style={{ color: '#3182F6' }}
                >
                  {row.points}
                </span>
                <span className="text-center text-xs text-toss-gray-700">
                  {row.wins}
                </span>
                <span className="text-center text-xs text-toss-gray-700">
                  {row.draws}
                </span>
                <span className="text-center text-xs text-toss-gray-700">
                  {row.losses}
                </span>
              </div>
            );
          })}

          {standings.length === 0 && !loading && (
            <div className="p-10 text-center text-toss-gray-400 text-sm">
              표시할 데이터가 없어요
            </div>
          )}
        </div>

        {/* Goal diff hint */}
        {standings.length > 0 && (
          <p className="text-[11px] text-toss-gray-400 mt-2 px-1">
            승점 = 승리 3점 + 무승부 1점. 동점 시 득실차로 순위 결정.
          </p>
        )}

        {/* 하단 배너 광고 */}
        {!loading && (
          <div className="mt-4">
            <BannerAd />
          </div>
        )}
      </div>

      {showModal && (
        <FavoriteTeamModal
          currentTeam={favorite}
          onClose={() => setShowModal(false)}
          onSelect={handleFavoriteSelect}
        />
      )}
    </div>
  );
}

// ─── 즐겨찾기 팀 카드 ───
function FavoriteTeamCard({
  team,
  standings,
  onReportClick,
}: {
  team: string;
  standings: TeamStanding[];
  onReportClick: () => void;
}) {
  const info = getTeam(team);
  const row = standings.find((s) => s.team === team);
  if (!row) {
    return (
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: info.bgLight }}
      >
        <div className="flex items-center gap-3">
          <TeamLogo team={team} size={36} />
          <div>
            <p className="font-bold text-sm" style={{ color: info.color }}>
              {info.fullName}
            </p>
            <p className="text-xs text-toss-gray-500 mt-0.5">
              데이터 동기화 중
            </p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: info.bgLight }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <TeamLogo team={team} size={36} />
          <div className="min-w-0">
            <p
              className="font-bold text-sm truncate"
              style={{ color: info.color }}
            >
              {info.fullName}
            </p>
            <p className="text-[11px] text-toss-gray-600 mt-0.5">
              {row.rank}위 · {row.games}경기 · 최근 {row.last5}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-2xl font-extrabold leading-tight"
            style={{ color: info.color }}
          >
            {row.points}
          </p>
          <p className="text-[10px] text-toss-gray-500">승점</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3">
        <Stat label="승" value={row.wins} color={info.color} />
        <Stat label="무" value={row.draws} color={info.color} />
        <Stat label="패" value={row.losses} color={info.color} />
        <Stat
          label="득실"
          value={`${row.goalDiff >= 0 ? '+' : ''}${row.goalDiff}`}
          color={info.color}
        />
      </div>
      {/* 상세 분석 리포트 진입 버튼 */}
      <button
        onClick={onReportClick}
        className="w-full mt-3 py-2.5 rounded-xl font-bold text-white text-sm shadow-sm active:scale-[0.98] transition-transform"
        style={{ backgroundColor: info.color }}
      >
        📊 상세 분석 리포트 보기
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="text-center bg-white/70 rounded-xl py-2">
      <p className="text-[10px] text-toss-gray-500">{label}</p>
      <p
        className="text-sm font-extrabold mt-0.5"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}
