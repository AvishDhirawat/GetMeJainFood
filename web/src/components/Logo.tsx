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
        {/* Clean gradient - deep emerald to vibrant green */}
        <linearGradient id={`jf-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* Simple rounded square background - modern & clean */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="18"
        fill={`url(#jf-grad-${size})`}
      />

      {/* Minimalist "J" - bold and modern */}
      <path
        d="M35 30 L35 55 C35 65 42 70 50 70 C55 70 58 68 60 65"
        stroke="white"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Simple leaf accent - minimal and elegant */}
      <path
        d="M60 32 C60 32 70 32 72 42 C72 42 67 38 60 40"
        fill="white"
        opacity="0.9"
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
          <stop offset="0%" stopColor="#047857" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      <rect x="10" y="10" width="80" height="80" rx="18" fill="url(#jf-icon-grad)"/>
      <path d="M35 30 L35 55 C35 65 42 70 50 70 C55 70 58 68 60 65" stroke="white" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M60 32 C60 32 70 32 72 42 C72 42 67 38 60 40" fill="white" opacity="0.9"/>
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
