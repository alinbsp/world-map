import { createPortal } from 'react-dom';
import type { TooltipContext, WorldMapClassNames } from './types';

interface TooltipProps {
  context: TooltipContext;
  renderTooltip?: (ctx: TooltipContext) => React.ReactNode;
  classNames?: WorldMapClassNames;
}

export function Tooltip({ context, renderTooltip, classNames }: TooltipProps) {
  const content = renderTooltip
    ? renderTooltip(context)
    : context.name;

  return createPortal(
    <div
      className={classNames?.tooltip}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        background: 'rgba(30,30,50,0.92)',
        color: '#fff',
        padding: '5px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        zIndex: 20,
        whiteSpace: 'nowrap',
        left: context.event.clientX + 14,
        top: context.event.clientY - 10,
      }}
    >
      {content}
    </div>,
    document.body,
  );
}
