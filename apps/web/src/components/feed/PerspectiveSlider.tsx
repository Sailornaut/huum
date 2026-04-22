'use client';

import Slider from '@/components/ui/Slider';
import Card from '@/components/ui/Card';
import { useFeedStore } from '@/lib/stores/feed.store';

const descriptions: Record<string, string> = {
  low: 'Mostly content from people you follow and those with similar views.',
  medium: 'A balanced mix of familiar voices and fresh perspectives.',
  high: 'Maximize exposure to different viewpoints and new voices.',
};

function getLevel(value: number) {
  if (value < 33) return 'low';
  if (value < 66) return 'medium';
  return 'high';
}

function getEmoji(value: number) {
  if (value < 20) return { icon: '\uD83D\uDEE1\uFE0F', label: 'Bubble' };
  if (value < 40) return { icon: '\uD83C\uDFE0', label: 'Familiar' };
  if (value < 60) return { icon: '\u2696\uFE0F', label: 'Balanced' };
  if (value < 80) return { icon: '\uD83C\uDF0D', label: 'Broad' };
  return { icon: '\uD83C\uDF0F', label: 'Globe' };
}

export function PerspectiveSlider() {
  const { perspectiveLevel, setPerspectiveLevel } = useFeedStore();
  const level = getLevel(perspectiveLevel);
  const emoji = getEmoji(perspectiveLevel);

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Your Perspective</h3>
        <span className="text-lg" title={emoji.label}>
          {emoji.icon} {emoji.label}
        </span>
      </div>

      <Slider value={perspectiveLevel} onChange={setPerspectiveLevel} min={0} max={100} step={1} />

      <div className="flex justify-between mt-2 text-[11px] text-gray-400">
        <span>Bubble</span>
        <span>Globe</span>
      </div>

      <p className="text-xs text-gray-500 mt-3">{descriptions[level]}</p>
    </Card>
  );
}

export default PerspectiveSlider;
