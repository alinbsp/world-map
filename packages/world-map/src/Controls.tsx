import type { WorldMapClassNames } from './types';

interface ControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  classNames?: WorldMapClassNames;
}

export function Controls({
  onZoomIn,
  onZoomOut,
  onReset,
  classNames,
}: ControlsProps) {
  const btnClass = classNames?.controlButton;

  return (
    <div
      className={classNames?.controls}
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 10,
      }}
    >
      <button
        className={btnClass}
        onClick={onZoomIn}
        title="Zoom In"
        style={defaultBtnStyle}
      >
        +
      </button>
      <button
        className={btnClass}
        onClick={onZoomOut}
        title="Zoom Out"
        style={defaultBtnStyle}
      >
        &minus;
      </button>
      <button
        className={btnClass}
        onClick={onReset}
        title="Reset View"
        style={{ ...defaultBtnStyle, fontSize: 16 }}
      >
        &#x27F2;
      </button>
    </div>
  );
}

const defaultBtnStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  border: 'none',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.92)',
  color: '#1a1a2e',
  fontSize: 22,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s',
};
