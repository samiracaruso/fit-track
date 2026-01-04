import React from 'react';

const musclePositions = {
  chest: { front: [{ cx: 50, cy: 28, rx: 12, ry: 6 }] },
  back: { back: [{ cx: 50, cy: 30, rx: 14, ry: 10 }] },
  shoulders: { front: [{ cx: 32, cy: 22, rx: 5, ry: 4 }, { cx: 68, cy: 22, rx: 5, ry: 4 }] },
  biceps: { front: [{ cx: 26, cy: 35, rx: 4, ry: 6 }, { cx: 74, cy: 35, rx: 4, ry: 6 }] },
  triceps: { back: [{ cx: 26, cy: 35, rx: 4, ry: 6 }, { cx: 74, cy: 35, rx: 4, ry: 6 }] },
  forearms: { front: [{ cx: 22, cy: 46, rx: 3, ry: 5 }, { cx: 78, cy: 46, rx: 3, ry: 5 }] },
  core: { front: [{ cx: 50, cy: 42, rx: 8, ry: 10 }] },
  quads: { front: [{ cx: 42, cy: 65, rx: 6, ry: 12 }, { cx: 58, cy: 65, rx: 6, ry: 12 }] },
  hamstrings: { back: [{ cx: 42, cy: 65, rx: 6, ry: 12 }, { cx: 58, cy: 65, rx: 6, ry: 12 }] },
  glutes: { back: [{ cx: 50, cy: 52, rx: 10, ry: 6 }] },
  calves: { back: [{ cx: 42, cy: 82, rx: 4, ry: 8 }, { cx: 58, cy: 82, rx: 4, ry: 8 }] },
  full_body: { 
    front: [{ cx: 50, cy: 50, rx: 20, ry: 35 }],
    back: [{ cx: 50, cy: 50, rx: 20, ry: 35 }]
  }
};

const BodySVG = ({ view, highlightedMuscles }) => {
  const getHighlights = () => {
    const highlights = [];
    highlightedMuscles.forEach(muscle => {
      const positions = musclePositions[muscle];
      if (positions && positions[view]) {
        positions[view].forEach((pos, idx) => {
          highlights.push({ ...pos, key: `${muscle}-${idx}` });
        });
      }
    });
    return highlights;
  };

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Body outline */}
      <ellipse cx="50" cy="12" rx="10" ry="10" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="50" cy="38" rx="16" ry="20" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="28" cy="35" rx="5" ry="15" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="72" cy="35" rx="5" ry="15" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="22" cy="52" rx="3" ry="8" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="78" cy="52" rx="3" ry="8" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="42" cy="70" rx="7" ry="18" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="58" cy="70" rx="7" ry="18" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="42" cy="92" rx="4" ry="6" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      <ellipse cx="58" cy="92" rx="4" ry="6" fill="#374151" stroke="#4B5563" strokeWidth="0.5" />
      
      {/* Highlighted muscles */}
      {getHighlights().map(({ cx, cy, rx, ry, key }) => (
        <ellipse
          key={key}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="rgba(239, 68, 68, 0.6)"
          stroke="#EF4444"
          strokeWidth="1"
          className="animate-pulse"
        />
      ))}
      
      {/* View label */}
      <text x="50" y="98" textAnchor="middle" fill="#6B7280" fontSize="6">
        {view === 'front' ? 'Front' : 'Back'}
      </text>
    </svg>
  );
};

export default function MuscleHighlight({ muscles = [], size = "md" }) {
  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-24 h-28",
    lg: "w-32 h-40"
  };

  const frontMuscles = muscles.filter(m => 
    ['chest', 'shoulders', 'biceps', 'forearms', 'core', 'quads', 'full_body'].includes(m)
  );
  const backMuscles = muscles.filter(m => 
    ['back', 'triceps', 'hamstrings', 'glutes', 'calves', 'full_body'].includes(m)
  );

  const showFront = frontMuscles.length > 0 || muscles.length === 0;
  const showBack = backMuscles.length > 0;

  return (
    <div className="flex gap-2">
      {showFront && (
        <div className={sizeClasses[size]}>
          <BodySVG view="front" highlightedMuscles={muscles} />
        </div>
      )}
      {showBack && (
        <div className={sizeClasses[size]}>
          <BodySVG view="back" highlightedMuscles={muscles} />
        </div>
      )}
    </div>
  );
}