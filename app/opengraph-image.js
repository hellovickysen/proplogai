import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PropLogAI — AI Trading Journal for Prop Firm Traders';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="22,42 50,49 50,75 22,69" fill="#08080f"/><polygon points="78,42 50,49 50,75 78,69" fill="#08080f"/><polyline points="50,49 63,39 74,27" fill="none" stroke="#08080f" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="74" cy="27" r="4.5" fill="#08080f"/></svg>';
const MARK_URI = 'data:image/svg+xml;base64,' + btoa(MARK);

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050508',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(120deg, #a78bfa, #22d3ee)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#08080f',
              fontWeight: 900,
            }}
          >
            <img width="30" height="30" src={MARK_URI} />
          </div>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            PropLogAI
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '900px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '52px',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            Still losing funded accounts
          </div>
          <div
            style={{
              fontSize: '52px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#f87171',
            }}
          >
            to the same mistakes?
          </div>
        </div>
        <div
          style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.55)',
            marginTop: '28px',
            maxWidth: '650px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          AI-powered trading journal that finds the pattern costing you funded accounts. Free beta — join now.
        </div>
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '40px',
          }}
        >
          {[
            { val: '85%', label: 'challenges fail' },
            { val: '$200+', label: 'per failure' },
            { val: '1 pattern', label: 'to fix' },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#a78bfa',
                }}
              >
                {s.val}
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(120deg, #a78bfa, #22d3ee)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
