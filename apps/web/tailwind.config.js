/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutrals are warmed a few degrees toward the accent hue so the greys
        // never read as cold slate against the orange.
        ink: {
          DEFAULT: "#0a0a0a",
          raised: "#141414",
          line: "#232120",
          muted: "#a0a0a0",
          bright: "#f5f5f5",
        },
        ember: {
          DEFAULT: "#cc5500",
          bright: "#ff6f14",
          dim: "#8a3a00",
        },
        blood: "#8b0000",
        pitch: "#1d3b28",
      },

      fontFamily: {
        display: ['"Archivo"', '"Arial Narrow"', "sans-serif"],
        body: ['"Manrope"', "system-ui", "sans-serif"],
      },

      fontSize: {
        // Fluid scale - headlines breathe on desktop without a media query.
        hero: ["clamp(3.5rem, 14vw, 11rem)", { lineHeight: "0.84", letterSpacing: "-0.03em" }],
        display: ["clamp(2rem, 5vw, 4rem)", { lineHeight: "0.92", letterSpacing: "-0.02em" }],
        title: ["clamp(1.5rem, 2.5vw, 2.25rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        score: ["clamp(1.75rem, 4vw, 2.75rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
        eyebrow: ["0.6875rem", { lineHeight: "1", letterSpacing: "0.24em" }],
      },

      spacing: {
        gutter: "clamp(1.25rem, 5vw, 5rem)",
        section: "clamp(4rem, 12vh, 9rem)",
      },

      maxWidth: {
        frame: "88rem",
      },

      boxShadow: {
        // The one glow in the system, reserved for hover on live content.
        ember: "0 0 0 1px rgba(204,85,0,0.45), 0 18px 45px -22px rgba(204,85,0,0.75)",
      },

      backgroundImage: {
        floodlight:
          "radial-gradient(120% 80% at 50% -10%, rgba(204,85,0,0.22) 0%, rgba(139,0,0,0.10) 32%, rgba(10,10,10,0) 68%)",
        stands:
          "repeating-linear-gradient(115deg, rgba(245,245,245,0.028) 0px, rgba(245,245,245,0.028) 1px, transparent 1px, transparent 7px)",
        // Screen-printed poster dot screen - sparse orange stippling, not a wash.
        halftone: "radial-gradient(rgba(204,85,0,0.5) 1px, transparent 1.5px)",
      },

      backgroundSize: {
        halftone: "9px 9px",
      },

      transitionTimingFunction: {
        // Exponential decel - things settle, never bounce.
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },

      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulseLive: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.82)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },

      animation: {
        shimmer: "shimmer 1.6s infinite",
        live: "pulseLive 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        ticker: "ticker var(--ticker-duration, 44s) linear infinite",
      },
    },
  },
  plugins: [],
};
