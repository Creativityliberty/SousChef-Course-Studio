
/**
 * THEME CONFIGURATION SYSTEM
 * This file controls the entire visual identity of the app.
 * AI Agents: Modify these values to change the UI globally.
 */

export const THEME = {
  // COLORS: Hex codes for primary, secondary and surface colors
  colors: {
    primary: '#6366f1',         // Indigo: Main brand color
    primaryLight: '#818cf8',    // Lighter shade for hover
    primarySoft: 'rgba(99, 102, 241, 0.08)',
    secondary: '#06b6d4',       // Cyan: Accent color
    background: '#f8faff',      // Main body background
    surface: '#ffffff',         // Card and container background
    textMain: '#080d1a',        // Deep navy for headings
    textMuted: '#64748b',       // Slate for descriptions
    error: '#f43f5e',           // Rose for alerts
    success: '#10b981',         // Emerald for completion
  },

  // RADIUS: Rounded shapes configuration (Very Rounded as requested)
  radius: {
    small: '1rem',              // 16px
    medium: '1.5rem',           // 24px
    large: '2.5rem',            // 40px
    extra: '4rem',              // 64px
    full: '9999px',             // Pill shape
  },

  // SPACING: Consistent layout padding and margins
  spacing: {
    container: 'clamp(2rem, 5vw, 5rem)',
    card: '2.5rem',
    element: '1.5rem',
  },

  // SHADOWS: Depth and premium feel
  shadows: {
    premium: '0 10px 40px -10px rgba(0,0,0,0.04)',
    premiumLg: '0 40px 100px -20px rgba(0,0,0,0.12)',
    glow: '0 15px 30px -5px rgba(99, 102, 241, 0.25)',
  }
};
