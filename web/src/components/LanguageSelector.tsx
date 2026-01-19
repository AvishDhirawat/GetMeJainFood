import { useState, useRef, useEffect } from 'react'
import { GlobeAltIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useLanguageStore } from '../store/languageStore'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguageStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  ] as const

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <GlobeAltIcon className="w-5 h-5" />
        <span className="text-sm font-medium">{language === 'hi' ? 'हिन्दी' : 'EN'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setIsOpen(false)
                }}
                className={`${
                  language === lang.code ? 'text-primary-600' : 'text-gray-700'
                } group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-gray-100`}
              >
                <span>{lang.nativeName}</span>
                {language === lang.code && (
                  <CheckIcon className="w-4 h-4 text-primary-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
