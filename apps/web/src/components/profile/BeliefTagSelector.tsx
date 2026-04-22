'use client';

const ALL_TAGS = [
  'tech', 'politics', 'philosophy', 'science', 'environment',
  'economics', 'culture', 'education', 'health', 'media',
  'sports', 'art', 'music', 'food', 'travel', 'gaming',
  'business', 'history', 'law', 'spirituality',
];

interface BeliefTagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export function BeliefTagSelector({ selected, onChange }: BeliefTagSelectorProps) {
  const toggle = (tag: string) => {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag],
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TAGS.map((tag) => {
        const isSelected = selected.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              isSelected
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
