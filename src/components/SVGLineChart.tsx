import './SVGLineChart.css';

interface DataPoint { date: string; value: number; }

interface Props {
  data: DataPoint[];
  color?: string;
  height?: number;
  showArea?: boolean;
  label?: string;
  valueFormatter?: (v: number) => string;
}

export function SVGLineChart({
  data, color = '#3b82f6', height = 200, showArea = true,
  label, valueFormatter = v => String(v)
}: Props) {
  if (data.length === 0) {
    return (
      <div className="slc-empty" style={{ height }}>
        <p>No data yet</p>
      </div>
    );
  }

  const pad = { top: 20, right: 20, bottom: 30, left: 45 };
  const w = 600;
  const cw = w - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const minVal = Math.min(...data.map(d => d.value), 0);
  const range = maxVal - minVal || 1;

  const pts = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * cw,
    y: pad.top + ch - ((d.value - minVal) / range) * ch,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pad.top + ch} L ${pts[0].x} ${pad.top + ch} Z`;

  // Y-axis ticks
  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const val = minVal + (range / ticks) * i;
    const y = pad.top + ch - (i / ticks) * ch;
    return { val: Math.round(val), y };
  });

  // X-axis labels (show ~5)
  const step = Math.max(1, Math.floor(data.length / 5));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1).map((d) => {
    const idx = data.indexOf(d);
    return {
      label: d.date.slice(5), // MM-DD
      x: pad.left + (idx / Math.max(data.length - 1, 1)) * cw,
    };
  });

  return (
    <div className="slc-container">
      {label && <h4 className="slc-label">{label}</h4>}
      <svg viewBox={`0 0 ${w} ${height}`} className="slc-svg">
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.left} y1={t.y} x2={w - pad.right} y2={t.y} className="slc-grid" />
            <text x={pad.left - 8} y={t.y + 4} className="slc-ytick" textAnchor="end">
              {valueFormatter(t.val)}
            </text>
          </g>
        ))}

        {/* Area */}
        {showArea && <path d={areaPath} fill={`url(#grad-${color.replace('#','')})`} className="slc-area" />}

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} className="slc-line" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3.5} fill={color} className="slc-dot" />
            <title>{`${p.date}: ${valueFormatter(p.value)}`}</title>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 6} className="slc-xtick" textAnchor="middle">
            {l.label}
          </text>
        ))}

        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
