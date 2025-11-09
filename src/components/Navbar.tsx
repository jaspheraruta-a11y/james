import { Menu } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Navbar({ onMenuClick, title = 'Dashboard' }: NavbarProps) {
  return (
    <nav className="glass-panel px-6 py-4 mb-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-200/50 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>
        <h2 className="text-2xl font-bold neon-text">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        <DarkModeToggle />
      </div>
    </nav>
  );
}
