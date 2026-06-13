import React from 'react';

// Donut Chart showing Veg / Non-Veg / Vegan distribution
export const DonutChart = ({ data = { Veg: 0, 'Non-Veg': 0, Vegan: 0 } }) => {
  const { Veg, 'Non-Veg': NonVeg, Vegan } = data;
  const total = Veg + NonVeg + Vegan;

  if (total === 0) {
    return (
      <div style={{ height: '200px', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
        No donation data recorded yet.
      </div>
    );
  }

  // Calculate percentages
  const pctVeg = (Veg / total) * 100;
  const pctNonVeg = (NonVeg / total) * 100;
  const pctVegan = (Vegan / total) * 100;

  // Donut geometry constants
  const size = 200;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 18;
  const center = size / 2;

  // Calculate dashes
  const dashVeg = (pctVeg / 100) * circumference;
  const dashNonVeg = (pctNonVeg / 100) * circumference;
  const dashVegan = (pctVegan / 100) * circumference;

  // Segments offsets
  const offsetVeg = 0;
  const offsetNonVeg = dashVeg;
  const offsetVegan = dashVeg + dashNonVeg;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth}
          />
          {/* Veg Segment */}
          {dashVeg > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashVeg} ${circumference}`}
              strokeDashoffset={-offsetVeg}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
            />
          )}
          {/* Non-Veg Segment */}
          {dashNonVeg > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashNonVeg} ${circumference}`}
              strokeDashoffset={-offsetNonVeg}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
            />
          )}
          {/* Vegan Segment */}
          {dashVegan > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#06b6d4"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashVegan} ${circumference}`}
              strokeDashoffset={-offsetVegan}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
            />
          )}
        </svg>

        {/* Central Label */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
        }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', display: 'block', lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Donations</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
          <span>Veg ({Veg})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} />
          <span>Non-Veg ({NonVeg})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#06b6d4' }} />
          <span>Vegan ({Vegan})</span>
        </div>
      </div>
    </div>
  );
};

// Bar Chart showing environmental or food saved metrics
export const BarChart = ({ label, values = [30, 45, 60, 25, 70, 85], categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] }) => {
  const maxVal = Math.max(...values, 10);
  const height = 180;
  const width = 300;

  return (
    <div style={{ width: '100%' }}>
      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '14px', textAlign: 'center' }}>
        {label}
      </h4>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: `${height}px`,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '8px',
        position: 'relative',
      }}>
        {values.map((val, idx) => {
          const barHeight = (val / maxVal) * (height - 40); // Leave space for values on top
          return (
            <div 
              key={idx} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                {val}
              </span>
              <div 
                style={{
                  width: '24px',
                  height: `${barHeight}px`,
                  background: 'linear-gradient(180deg, #10b981 0%, rgba(6, 182, 212, 0.2) 100%)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)',
                  transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }} 
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', position: 'absolute', bottom: '-22px' }}>
                {categories[idx]}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ height: '24px' }} /> {/* Spacer for absolute labels */}
    </div>
  );
};
