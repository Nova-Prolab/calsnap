'use client';

interface CircularProgressProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function CircularProgress({ 
  progress, 
  size = 100, 
  strokeWidth = 10,
  className,
  textClassName,
  showText = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--secondary))" // Use theme color
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))" // Use theme color
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <div className={`absolute inset-0 flex items-center justify-center ${textClassName}`}>
          <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}
