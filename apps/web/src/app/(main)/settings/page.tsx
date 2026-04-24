'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { BeliefTagSelector } from '@/components/profile/BeliefTagSelector';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usersApi } from '@/lib/api/users';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import type { ProfileFont } from '@/lib/types';

const PROFILE_FONT_OPTIONS: { value: ProfileFont; label: string; helper: string }[] = [
  { value: 'sans', label: 'Clean Sans', helper: 'Modern and neutral.' },
  { value: 'serif', label: 'Editorial Serif', helper: 'More personal and expressive.' },
  { value: 'mono', label: 'Technical Mono', helper: 'Structured and distinctive.' },
  { value: 'display', label: 'Bold Display', helper: 'Sharper headings without going wild.' },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [profile, setProfile] = useState({
    displayName: user?.displayName ?? '',
    bio: user?.bio ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    bannerUrl: user?.bannerUrl ?? '',
    profileFont: (user?.profileFont ?? 'sans') as ProfileFont,
  });
  const [perspectiveLevel, setPerspectiveLevel] = useState(0.3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        displayName: user.displayName ?? '',
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
        bannerUrl: user.bannerUrl ?? '',
        profileFont: (user.profileFont ?? 'sans') as ProfileFont,
      });
      setSelectedTags(user.beliefTags?.map((t) => t.slug) ?? []);
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updatedUser = await usersApi.updateProfile(profile);
      setUser(updatedUser);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    try {
      await usersApi.updatePreferences({ perspectiveSlider: perspectiveLevel });
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const perspectiveLabels: Record<string, string> = {
    '0': 'My bubble — Only people I follow',
    '0.3': 'Default — Mostly followed, some new voices',
    '0.5': 'Balanced — Equal mix of familiar and new',
    '0.8': 'Explorer — Mostly new perspectives',
    '1': 'Wide open — Maximum diversity',
  };

  const closestLabel =
    perspectiveLabels[perspectiveLevel.toString()] ??
    `Custom — ${Math.round(perspectiveLevel * 100)}% diversity`;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <div className="space-y-4">
          {user && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                Live preview
              </p>
              <ProfileHeader
                user={{
                  ...user,
                  displayName: profile.displayName || user.displayName,
                  bio: profile.bio || null,
                  avatarUrl: profile.avatarUrl || null,
                  bannerUrl: profile.bannerUrl || null,
                  profileFont: profile.profileFont,
                }}
              />
            </div>
          )}
          <Input
            label="Display name"
            value={profile.displayName}
            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              maxLength={300}
            />
          </div>
          <Input
            label="Profile picture URL"
            value={profile.avatarUrl}
            onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="Background image URL"
            value={profile.bannerUrl}
            onChange={(e) => setProfile({ ...profile, bannerUrl: e.target.value })}
            placeholder="https://..."
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Profile font</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROFILE_FONT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setProfile({ ...profile, profileFont: option.value })}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    profile.profileFont === option.value
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{option.label}</div>
                  <div className="mt-1 text-xs text-gray-500">{option.helper}</div>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={saveProfile} loading={saving}>
            Save profile
          </Button>
        </div>
      </Card>

      {/* Perspective Slider */}
      <Card>
        <h2 className="mb-2 text-lg font-semibold">Perspective Slider</h2>
        <p className="mb-4 text-sm text-gray-500">
          Control how much content from outside your network appears in your feed.
          More diversity means more exposure to different viewpoints.
        </p>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={perspectiveLevel}
          onChange={setPerspectiveLevel}
        />
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>My bubble</span>
          <span>Wide open</span>
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {closestLabel}
        </p>
        <Button onClick={savePreferences} variant="secondary" className="mt-4">
          Save preferences
        </Button>
      </Card>

      {/* Belief Tags */}
      <Card>
        <h2 className="mb-2 text-lg font-semibold">Your Interests</h2>
        <p className="mb-4 text-sm text-gray-500">
          Select topics you care about. This helps us find relevant diverse content for you.
        </p>
        <BeliefTagSelector selected={selectedTags} onChange={setSelectedTags} />
        <Button
          variant="secondary"
          className="mt-4"
          onClick={async () => {
            try {
              await usersApi.setBeliefTags(selectedTags);
              toast.success('Interests updated');
            } catch {
              toast.error('Failed to save');
            }
          }}
        >
          Save interests
        </Button>
      </Card>
    </div>
  );
}
