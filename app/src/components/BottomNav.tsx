import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Target, Zap, Calendar } from 'lucide-react';

const navItems = [
  { path: '/', label: '순위', icon: Trophy },
  { path: '/goals', label: '득점왕', icon: Zap },
  { path: '/assists', label: '도움왕', icon: Target },
  { path: '/games', label: '경기', icon: Calendar },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <Icon size={22} color={isActive ? '#0C308E' : '#B0B8C1'} strokeWidth={isActive ? 2.4 : 1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
