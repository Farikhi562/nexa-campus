# NEXA Campus visual refresh

## Updated
- Replaced the teal/cyan-heavy primary theme with a restrained ink-navy, cobalt-blue, and orange accent palette.
- Preserved semantic status colors such as success, warning, and error.
- Reduced glassmorphism, blur, neon glow, and decorative grid/radar effects on the landing and authentication surfaces.
- Switched the global font stack to Coolvetica with safe fallbacks.
- Updated inline SVG logo colors to the new cobalt palette.
- Changed the main application background to a warm off-white (`#f7f5ef`).

## Coolvetica file
A font binary is intentionally not bundled. Add a licensed file at:

`public/fonts/Coolvetica.woff2`

The CSS is already wired to load it.

## Note
The uploaded archive did not include `package.json`, Tailwind config, or Next config, so a full production build could not be executed from this bundle alone.
