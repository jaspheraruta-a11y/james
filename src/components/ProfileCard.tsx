import { User } from 'lucide-react';
import type { Profile } from '../types';

interface ProfileCardProps {
  profile: Profile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="glass-panel p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600
                      flex items-center justify-center shadow-lg shadow-cyan-500/50">
        <User className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">
          {profile.firstname || profile.username || 'User'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{profile.role}</p>
      </div>
    </div>
  );
}
