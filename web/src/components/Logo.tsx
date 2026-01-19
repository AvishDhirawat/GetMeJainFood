import { motion } from 'framer-motion'

interface LogoProps {
  variant?: 'full' | 'icon' | 'horizontal'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  className?: string
  showText?: boolean
  darkMode?: boolean
}

const sizeMap = {
  sm: { icon: 32, text: 'text-base', gap: 'gap-2' },
  md: { icon: 40, text: 'text-xl', gap: 'gap-2.5' },
  lg: { icon: 52, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 64, text: 'text-3xl', gap: 'gap-3.5' },
}

export default function Logo({
  variant = 'full',
  size = 'md',
  animated = true,
  className = '',
  showText = true,
  darkMode = false,
}: LogoProps) {
  const dimensions = sizeMap[size]

  const LogoMark = ({ width = dimensions.icon, height = dimensions.icon }: { width?: number; height?: number }) => (
    <svg
      viewBox="0 0 100 100"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <defs>
        {/* Premium gradient - emerald to mint */}
        <linearGradient id={`jf-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id={`jf-shadow-${size}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#059669" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* Premium rounded square with subtle shadow */}
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="18"
        fill={`url(#jf-grad-${size})`}
        filter={`url(#jf-shadow-${size})`}
      />

      {/* Elegant "J" letterform */}
      <path
        d="M36 26 L36 58 C36 70 44 78 56 78 C64 78 70 74 74 66"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Premium leaf design */}
      <path
        d="M62 24 Q78 24 78 40 Q78 34 68 34 Q76 42 68 50 Q60 42 62 24 Z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  )

  const LogoText = () => (
    <div className="flex flex-col">
      <div className={`font-bold ${dimensions.text} leading-none tracking-tight`}>
        <span className="text-gray-900" style={{ color: darkMode ? '#fff' : '#111827' }}>
          JainFood
        </span>
      </div>
      {variant === 'full' && size !== 'sm' && (
        <span className="text-[10px] text-gray-500 tracking-wide font-medium mt-0.5" style={{ color: darkMode ? '#9CA3AF' : '#6B7280' }}>
          Pure & Fresh
        </span>
      )}
    </div>
  )

  if (variant === 'icon') {
    return animated ? (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={className}
      >
        <LogoMark />
      </motion.div>
    ) : (
      <div className={className}>
        <LogoMark />
      </div>
    )
  }

  const content = (
    <div className={`flex items-center ${dimensions.gap} ${className}`}>
      <LogoMark />
      {showText && <LogoText />}
    </div>
  )

  return animated ? (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="cursor-pointer inline-block"
    >
      {content}
    </motion.div>
  ) : content
}

// Standalone icon for favicons
export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="jf-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="jf-icon-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#059669" floodOpacity="0.2"/>
        </filter>
      </defs>

      <rect x="8" y="8" width="84" height="84" rx="18" fill="url(#jf-icon-grad)" filter="url(#jf-icon-shadow)"/>
      <path d="M36 26 L36 58 C36 70 44 78 56 78 C64 78 70 74 74 66" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M62 24 Q78 24 78 40 Q78 34 68 34 Q76 42 68 50 Q60 42 62 24 Z" fill="white" opacity="0.95"/>
    </svg>
  )
}

// Text-only logo
export function LogoText({
  size = 'md',
  darkMode = false,
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  darkMode?: boolean
  className?: string
}) {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  return (
    <span className={`font-bold ${sizeClasses[size]} tracking-tight ${className}`}>
      <span style={{ color: darkMode ? '#fff' : '#111827' }}>JainFood</span>
    </span>
  )
}
