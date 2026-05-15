import { useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Target, Send, Calendar } from 'lucide-react';

const navItems = [
  { path: '/',         label: '순위', icon: Trophy },
  { path: '/scorers',  label: '득점', icon: Target },
  { path: '/assists',  label: '도움', icon: Send },
  { path: '/schedule', label: '일정', icon: Calendar },
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
            <Icon size={22} color={isActive ? '#3182F6' : '#B0B8C1'} strokeWidth={isActive ? 2.4 : 1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
