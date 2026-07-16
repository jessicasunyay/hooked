import { useEffect, useState } from "react";

interface YarnBallProps {
  active: boolean;
  onToggle: () => void;
}

// path to the bundled yarn-ball PNG in public/.
export const YARN_BALL_IMAGE = "/yarn-ball-cropped.png";
// fallback if the PNG is missing — keeps the popup from rendering a broken image.
const FALLBACK = "/hook-fallback.png";

// an interactive ball-of-yarn switch for Stitch Mode.
// grayscale + still when off; full color + gently bobbing + soft glow when on; pops on toggle.
export function YarnBall({ active, onToggle }: YarnBallProps) {
  // trigger a one-shot pop animation whenever `active` flips
  const [popping, setPopping] = useState(false);
  useEffect(() => {
    setPopping(true);
    const t = setTimeout(() => setPopping(false), 420);
    return () => clearTimeout(t);
  }, [active]);

  // fall back to the bundled hook icon if the yarn-ball PNG fails to load
  const [src, setSrc] = useState(YARN_BALL_IMAGE);
  const handleerror = () => {
    if (src !== FALLBACK) setSrc(FALLBACK);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label="Toggle Stitch Mode"
      onClick={onToggle}
      className="rounded-full p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
    >
      <span className={`inline-block ${active ? "yarn-float" : ""}`}>
        <img
          src={src}
          onError={handleerror}
          alt=""
          width="80"
          height="80"
          className={`h-20 w-20 select-none ${popping ? "yarn-pop" : ""} ${
            active
              ? "drop-shadow-[0_0_10px_rgba(143,194,233,0.65)]"
              : "grayscale opacity-70"
          }`}
          draggable={false}
        />
      </span>
    </button>
  );
}

export default YarnBall;
