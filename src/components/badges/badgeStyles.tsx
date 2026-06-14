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

      .nexa-badge-card .nexa-badge-title,
      .nexa-badge-card .nexa-badge-description,
      .nexa-badge-card .nexa-badge-meta,
      .nexa-badge-card .nexa-badge-requirement {
        opacity: 1 !important;
        text-shadow: none !important;
      }

      .nexa-badge-biasa,
      .nexa-badge-biasa .nexa-badge-title,
      .nexa-badge-biasa .nexa-badge-description,
      .nexa-badge-biasa .nexa-badge-meta,
      .nexa-badge-biasa .nexa-badge-requirement { color: #0f172a !important; }

      .nexa-badge-langka,
      .nexa-badge-langka .nexa-badge-title,
      .nexa-badge-langka .nexa-badge-description,
      .nexa-badge-langka .nexa-badge-meta,
      .nexa-badge-langka .nexa-badge-requirement { color: #082f49 !important; }

      .nexa-badge-epic,
      .nexa-badge-epic .nexa-badge-title,
      .nexa-badge-epic .nexa-badge-description,
      .nexa-badge-epic .nexa-badge-meta,
      .nexa-badge-epic .nexa-badge-requirement { color: #3b0764 !important; }

      .nexa-badge-legend,
      .nexa-badge-legend .nexa-badge-title,
      .nexa-badge-legend .nexa-badge-description,
      .nexa-badge-legend .nexa-badge-meta,
      .nexa-badge-legend .nexa-badge-requirement { color: #451a03 !important; }

      .nexa-badge-mythos,
      .nexa-badge-mythos .nexa-badge-title,
      .nexa-badge-mythos .nexa-badge-description,
      .nexa-badge-mythos .nexa-badge-meta,
      .nexa-badge-mythos .nexa-badge-requirement {
        color: #ffffff !important;
        text-shadow: 0 1px 18px rgba(0, 0, 0, 0.35) !important;
      }

      .nexa-badge-description,
      .nexa-badge-requirement { font-weight: 750; line-height: 1.65; }
      .nexa-badge-meta { opacity: 0.82 !important; }

      .nexa-badge-medal {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 12px 24px rgba(15, 23, 42, 0.13);
        border: 1px solid rgba(255, 255, 255, 0.72);
      }

      .nexa-rarity-pill,
      .nexa-badge-status-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.28rem 0.6rem;
        font-size: 0.62rem;
        line-height: 1;
        font-weight: 950;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        border: 1px solid rgba(15, 23, 42, 0.1);
        background: rgba(255, 255, 255, 0.78);
        color: inherit !important;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
      }

      .nexa-badge-glow,
      .nexa-badge-shine {
        pointer-events: none;
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      .nexa-badge-biasa { background: linear-gradient(135deg, #ffffff, #f8fafc) !important; }
      .nexa-badge-biasa .nexa-badge-medal { background: #ffffff; }

      .nexa-badge-langka {
        background: radial-gradient(circle at 18% 12%, rgba(14, 165, 233, 0.22), transparent 30%), linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 54%, #f8fafc 100%) !important;
      }

      .nexa-badge-epic {
        background: radial-gradient(circle at 20% 18%, rgba(168, 85, 247, 0.22), transparent 32%), linear-gradient(135deg, #faf5ff 0%, #ede9fe 56%, #fff7ed 100%) !important;
      }
      .nexa-badge-epic .nexa-badge-shine {
        background: linear-gradient(115deg, transparent 0%, transparent 36%, rgba(255, 255, 255, 0.55) 49%, transparent 64%, transparent 100%);
        transform: translateX(-120%);
        animation: nexaEpicShine 4.6s ease-in-out infinite;
        opacity: 0.8;
      }
      .nexa-badge-epic .nexa-badge-medal { animation: nexaEpicPulse 3.4s ease-in-out infinite; }

      .nexa-badge-legend {
        background: radial-gradient(circle at 18% 18%, rgba(251, 191, 36, 0.35), transparent 30%), linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fde68a 100%) !important;
      }
      .nexa-badge-legend .nexa-badge-glow {
        background: conic-gradient(from 0deg, transparent, rgba(251, 191, 36, 0.24), transparent, rgba(253, 224, 71, 0.22), transparent);
        animation: nexaLegendRotate 7s linear infinite;
      }
      .nexa-badge-legend .nexa-badge-medal { animation: nexaLegendFloat 2.8s ease-in-out infinite; }

      .nexa-badge-mythos {
        background: radial-gradient(circle at 20% 10%, rgba(244, 114, 182, 0.62), transparent 22%), radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.55), transparent 24%), radial-gradient(circle at 50% 85%, rgba(167, 139, 250, 0.72), transparent 26%), linear-gradient(135deg, #120318, #241151 42%, #071827 100%) !important;
        box-shadow: 0 24px 70px rgba(168, 85, 247, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
      }
      .nexa-badge-mythos .nexa-badge-glow {
        background: conic-gradient(from 0deg, rgba(34, 211, 238, 0.28), rgba(217, 70, 239, 0.38), rgba(250, 204, 21, 0.30), rgba(34, 211, 238, 0.28));
        animation: nexaMythosSpin 4.8s linear infinite;
        opacity: 0.78;
        filter: blur(8px);
      }
      .nexa-badge-mythos .nexa-badge-shine {
        background: linear-gradient(120deg, transparent 5%, rgba(255, 255, 255, 0.45) 18%, transparent 32%, transparent 100%);
        animation: nexaMythosSweep 2.7s ease-in-out infinite;
      }
      .nexa-badge-mythos .nexa-badge-medal {
        background: rgba(255, 255, 255, 0.18);
        color: white;
        text-shadow: 0 0 18px rgba(255, 255, 255, 0.88);
        animation: nexaMythosMedal 2.3s ease-in-out infinite;
      }

      .nexa-badge-locked .nexa-badge-inner {
        filter: blur(3.6px) saturate(0.58);
        opacity: 0.42;
      }
      .nexa-badge-locked {
        cursor: pointer;
      }
      .nexa-badge-lock-overlay {
        position: absolute;
        inset: 0;
        z-index: 20;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem;
        background: linear-gradient(to top, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.34), rgba(15, 23, 42, 0.10));
        color: white !important;
      }
      .nexa-badge-lock-icon {
        position: absolute;
        right: 1rem;
        top: 1rem;
        display: grid;
        height: 2.6rem;
        width: 2.6rem;
        place-items: center;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.82);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.28);
      }
      .nexa-badge-lock-copy { color: #ffffff !important; text-shadow: 0 2px 20px rgba(0, 0, 0, 0.35); }

      @keyframes nexaEpicShine { 0%, 58% { transform: translateX(-120%); opacity: 0; } 72% { opacity: 0.75; } 100% { transform: translateX(120%); opacity: 0; } }
      @keyframes nexaEpicPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
      @keyframes nexaLegendRotate { to { transform: rotate(360deg); } }
      @keyframes nexaLegendFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3px) scale(1.055); } }
      @keyframes nexaMythosSpin { to { transform: rotate(360deg) scale(1.12); } }
      @keyframes nexaMythosSweep { 0%, 40% { transform: translateX(-130%); opacity: 0; } 62% { opacity: 0.9; } 100% { transform: translateX(130%); opacity: 0; } }
      @keyframes nexaMythosMedal { 0%, 100% { transform: translateY(0) rotate(-2deg) scale(1); filter: hue-rotate(0deg); } 50% { transform: translateY(-5px) rotate(2deg) scale(1.085); filter: hue-rotate(60deg); } }

      @media (prefers-reduced-motion: reduce) {
        .nexa-badge-card *, .nexa-badge-glow, .nexa-badge-shine, .nexa-badge-medal { animation: none !important; transition: none !important; }
      }
    `}</style>
  )
}
