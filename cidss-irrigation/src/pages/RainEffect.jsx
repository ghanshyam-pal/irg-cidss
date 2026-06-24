import { useMemo } from "react";
import "./RainEffect.css";

export default function RainEffect() {
  const drops = useMemo(() => {
    let increment = 0;
    const rainDrops = [];

    while (increment < 100) {
      const randoHundo = Math.floor(Math.random() * 98) + 1;
      const randoFiver = Math.floor(Math.random() * 4) + 2;

      increment += randoFiver;

      rainDrops.push({
        left: increment,
        bottom: randoFiver + randoFiver - 1 + 100,
        delay: `0.${randoHundo}s`,
        duration: `0.5${randoHundo}s`,
      });
    }

    return rainDrops;
  }, []);

  return (
    <>
      {/* Front Rain */}
      <div className="rain front-row">
        {drops.map((drop, index) => (
          <div
            key={index}
            className="drop"
            style={{
              left: `${drop.left}%`,
              bottom: `${drop.bottom}%`,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
            }}
          >
            <div
              className="stem"
              style={{
                animationDelay: drop.delay,
                animationDuration: drop.duration,
              }}
            />
            <div
              className="splat"
              style={{
                animationDelay: drop.delay,
                animationDuration: drop.duration,
              }}
            />
          </div>
        ))}
      </div>

      {/* Back Rain */}
      <div className="rain back-row">
        {drops.map((drop, index) => (
          <div
            key={`back-${index}`}
            className="drop"
            style={{
              right: `${drop.left}%`,
              bottom: `${drop.bottom}%`,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
            }}
          >
            <div
              className="stem"
              style={{
                animationDelay: drop.delay,
                animationDuration: drop.duration,
              }}
            />
            <div
              className="splat"
              style={{
                animationDelay: drop.delay,
                animationDuration: drop.duration,
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
}