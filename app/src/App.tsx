import { useState, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import StandingsPage from '@/pages/StandingsPage';
import GoalsPage from '@/pages/GoalsPage';
import AssistsPage from '@/pages/AssistsPage';
import GamesPage from '@/pages/GamesPage';
import TeamReportPage from '@/pages/TeamReportPage';
import BottomNav from '@/components/BottomNav';
import FavoriteTeamModal from '@/components/FavoriteTeamModal';
import InterstitialAd from '@/components/InterstitialAd';
import {
  hasOnboarded,
  markOnboarded,
  setFavoriteTeam,
  incrementInterstitialCount,
  resetInterstitialCount,
} from '@/utils/storage';

// 몇 번 탭 이동마다 전면광고를 띄울지
const INTERSTITIAL_INTERVAL = 5;

export default function App() {
  // MemoryRouter: 앱인토스 웹뷰의 뒤로가기 버튼과 브라우저 히스토리 충돌 방지
  return (
    <MemoryRouter initialEntries={['/']}>
      <AppShell />
    </MemoryRouter>
  );
}

function AppShell() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const location = useLocation();

  // 첫 진입 시 온보딩 모달
  useEffect(() => {
    if (!hasOnboarded()) {
      const t = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const handleOnboardingSelect = (team: string | null) => {
    setFavoriteTeam(team);
    markOnboarded();
  };

  // 리포트 페이지에서는 하단 탭바 숨김
  const hideBottomNav = location.pathname === '/report';

  return (
    <>
      <BackButtonHandler />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<StandingsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/assists" element={<AssistsPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/report" element={<TeamReportPage />} />
        </Routes>
      </div>
      {!hideBottomNav && <BottomNav />}

      {showInterstitial && (
        <InterstitialAd
          onClose={() => setShowInterstitial(false)}
          onComplete={() => resetInterstitialCount()}
        />
      )}

      {showOnboarding && (
        <FavoriteTeamModal
          currentTeam={null}
          isOnboarding
          onClose={() => setShowOnboarding(false)}
          onSelect={handleOnboardingSelect}
        />
      )}

      <GlobalClickTracker
        onShouldShowAd={() => setShowInterstitial(true)}
      />
    </>
  );
}

// 앱인토스 뒤로가기 통합 처리
function BackButtonHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleBack = (e: PopStateEvent) => {
      if (location.pathname !== '/') {
        e.preventDefault();
        navigate('/', { replace: true });
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handleBack);
    window.history.pushState(null, '', window.location.href);

    return () => window.removeEventListener('popstate', handleBack);
  }, [location.pathname, navigate]);

  return null;
}

// 탭 클릭 카운트 → N번에 1회 전면광고
function GlobalClickTracker({ onShouldShowAd }: { onShouldShowAd: () => void }) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const navButton = target.closest('.bottom-nav-item');
      if (!navButton) return;

      const count = incrementInterstitialCount();
      if (count > 0 && count % INTERSTITIAL_INTERVAL === 0) {
        setTimeout(() => onShouldShowAd(), 300);
      }
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [onShouldShowAd]);

  return null;
}
