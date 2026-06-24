import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PropLogAI — AI Trading Journal for Prop Firm Traders';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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
            ◆
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
                  background: 'linear-gradient(120deg, #a78bfa, #22d3ee)',
                  backgroundClip: 'text',
                  color: 'transparent',
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
