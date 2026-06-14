export default function BadgeStyles() {
  return (
    <style jsx global>{`
      .nexa-badge-card {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        border-width: 1px;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      }

      .nexa-badge-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
      }

      .nexa-badge-medal {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.82);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 12px 24px rgba(15, 23, 42, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.66);
      }

      .nexa-rarity-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.25rem 0.55rem;
        font-size: 0.62rem;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        border: 1px solid rgba(255, 255, 255, 0.45);
        background: rgba(255, 255, 255, 0.65);
      }

      .nexa-badge-glow,
      .nexa-badge-shine {
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: -1;
      }

      .nexa-badge-biasa .nexa-badge-medal {
        background: #f8fafc;
      }

      .nexa-badge-langka {
        background:
          radial-gradient(circle at 15% 10%, rgba(125, 211, 252, 0.42), transparent 28%),
          linear-gradient(135deg, rgba(240, 249, 255, 0.95), rgba(224, 242, 254, 0.78));
      }

      .dark .nexa-badge-langka {
        background:
          radial-gradient(circle at 15% 10%, rgba(56, 189, 248, 0.25), transparent 30%),
          linear-gradient(135deg, rgba(8, 47, 73, 0.85), rgba(15, 23, 42, 0.92));
      }

      .nexa-badge-epic {
        background:
          radial-gradient(circle at 20% 20%, rgba(216, 180, 254, 0.52), transparent 30%),
          linear-gradient(135deg, rgba(250, 245, 255, 0.96), rgba(237, 233, 254, 0.85));
      }

      .dark .nexa-badge-epic {
        background:
          radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.26), transparent 30%),
          linear-gradient(135deg, rgba(59, 7, 100, 0.72), rgba(15, 23, 42, 0.94));
      }

      .nexa-badge-epic .nexa-badge-shine {
        background: linear-gradient(115deg, transparent 0%, transparent 35%, rgba(255, 255, 255, 0.35) 50%, transparent 66%, transparent 100%);
        transform: translateX(-120%);
        animation: nexaEpicShine 3.8s ease-in-out infinite;
      }

      .nexa-badge-epic .nexa-badge-medal {
        animation: nexaEpicPulse 2.9s ease-in-out infinite;
      }

      .nexa-badge-legend {
        background:
          radial-gradient(circle at 18% 18%, rgba(253, 230, 138, 0.72), transparent 30%),
          linear-gradient(135deg, #fff7ed, #fef3c7 48%, #fde68a);
      }

      .dark .nexa-badge-legend {
        background:
          radial-gradient(circle at 18% 18%, rgba(245, 158, 11, 0.38), transparent 30%),
          linear-gradient(135deg, rgba(69, 26, 3, 0.88), rgba(15, 23, 42, 0.94));
      }

      .nexa-badge-legend .nexa-badge-glow {
        background: conic-gradient(from 0deg, transparent, rgba(251, 191, 36, 0.36), transparent, rgba(253, 224, 71, 0.28), transparent);
        animation: nexaLegendRotate 6s linear infinite;
      }

      .nexa-badge-legend .nexa-badge-medal {
        animation: nexaLegendFloat 2.6s ease-in-out infinite;
      }

      .nexa-badge-mythos {
        background:
          radial-gradient(circle at 20% 10%, rgba(244, 114, 182, 0.65), transparent 22%),
          radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.55), transparent 24%),
          radial-gradient(circle at 50% 85%, rgba(167, 139, 250, 0.72), transparent 26%),
          linear-gradient(135deg, #14051f, #241151 42%, #071827 100%);
        box-shadow: 0 24px 70px rgba(168, 85, 247, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
      }

      .nexa-badge-mythos .nexa-badge-glow {
        background:
          conic-gradient(from 0deg, rgba(34, 211, 238, 0.28), rgba(217, 70, 239, 0.38), rgba(250, 204, 21, 0.30), rgba(34, 211, 238, 0.28));
        animation: nexaMythosSpin 4.8s linear infinite;
        opacity: 0.85;
        filter: blur(7px);
      }

      .nexa-badge-mythos .nexa-badge-shine {
        background:
          linear-gradient(120deg, transparent 5%, rgba(255, 255, 255, 0.5) 18%, transparent 32%, transparent 100%);
        animation: nexaMythosSweep 2.5s ease-in-out infinite;
      }

      .nexa-badge-mythos .nexa-badge-medal {
        background: rgba(255, 255, 255, 0.16);
        color: white;
        text-shadow: 0 0 18px rgba(255, 255, 255, 0.88);
        animation: nexaMythosMedal 2.2s ease-in-out infinite;
      }

      .nexa-rarity-mythos {
        background: rgba(255, 255, 255, 0.16);
        color: white;
      }

      @keyframes nexaEpicShine {
        0%, 55% { transform: translateX(-120%); opacity: 0; }
        70% { opacity: 1; }
        100% { transform: translateX(120%); opacity: 0; }
      }

      @keyframes nexaEpicPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.045); }
      }

      @keyframes nexaLegendRotate {
        to { transform: rotate(360deg); }
      }

      @keyframes nexaLegendFloat {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-3px) scale(1.06); }
      }

      @keyframes nexaMythosSpin {
        to { transform: rotate(360deg) scale(1.15); }
      }

      @keyframes nexaMythosSweep {
        0%, 40% { transform: translateX(-130%); opacity: 0; }
        62% { opacity: 0.95; }
        100% { transform: translateX(130%); opacity: 0; }
      }

      @keyframes nexaMythosMedal {
        0%, 100% { transform: translateY(0) rotate(-2deg) scale(1); filter: hue-rotate(0deg); }
        50% { transform: translateY(-5px) rotate(2deg) scale(1.09); filter: hue-rotate(60deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .nexa-badge-card *,
        .nexa-badge-glow,
        .nexa-badge-shine,
        .nexa-badge-medal {
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  )
}
