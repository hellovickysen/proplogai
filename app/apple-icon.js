import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Open Journal mark (dark glyph) embedded as an SVG data-URI for Satori.
const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="22,42 50,49 50,75 22,69" fill="#08080f"/><polygon points="78,42 50,49 50,75 78,69" fill="#08080f"/><polyline points="50,49 63,39 74,27" fill="none" stroke="#08080f" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="74" cy="27" r="4.5" fill="#08080f"/></svg>';
const MARK_URI = 'data:image/svg+xml;base64,' + btoa(MARK);

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #a78bfa, #22d3ee)',
        }}
      >
        <img width="120" height="120" src={MARK_URI} />
      </div>
    ),
    { ...size }
  );
}
