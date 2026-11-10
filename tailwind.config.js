/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Indian Heritage Design System Palette
        heritage: {
          ivory: {
            DEFAULT: '#FDFBF7',
            50: '#FFFFFF',
            100: '#FDFBF7',
            200: '#F7F3EB',
            300: '#EFE9DC',
            400: '#E5DCStyle',
          },
          sandstone: {
            DEFAULT: '#D4A373',
            50: '#FBF7F2',
            100: '#F4EAE1',
            200: '#E8D4C3',
            300: '#DDBFA5',
            400: '#D4A373',
            500: '#C58C54',
            600: '#A97039',
            700: '#875629',
          },
          green: {
            DEFAULT: '#1B4332',
            50: '#EBF4F0',
            100: '#D2E7DD',
            200: '#A6CFC0',
            300: '#75B49E',
            400: '#40916C',
            500: '#2D6A4F',
            600: '#1B4332',
            700: '#143326',
            800: '#0E231A',
            900: '#081510',
          },
          gold: {
            DEFAULT: '#C5A059',
            50: '#FAF7F0',
            100: '#F4ECDD',
            200: '#E7D8BA',
            300: '#DBC396',
            400: '#CFAF72',
            500: '#C5A059',
            600: '#A6823B',
            700: '#7F6229',
          },
          charcoal: {
            DEFAULT: '#212529',
            50: '#F8F9FA',
            100: '#E9ECEF',
            200: '#DEE2E6',
            300: '#CED4DA',
            400: '#6C757D',
            500: '#495057',
            600: '#343A40',
            700: '#2B3035',
            800: '#212529',
            900: '#121416',
          },
        },
        // Crowd Level Indicator System Colors
        crowd: {
          low: {
            bg: '#ECFDF5',
            text: '#065F46',
            border: '#A7F3D0',
            badge: '#10B981',
          },
          moderate: {
            bg: '#FFFBEB',
            text: '#92400E',
            border: '#FDE68A',
            badge: '#F59E0B',
          },
          high: {
            bg: '#FEF2F2',
            text: '#991B1B',
            border: '#FECACA',
            badge: '#EF4444',
          },
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'heritage-sm': '0 1px 3px rgba(33, 37, 41, 0.05), 0 1px 2px rgba(212, 163, 115, 0.1)',
        'heritage-md': '0 4px 6px -1px rgba(33, 37, 41, 0.07), 0 2px 4px -1px rgba(212, 163, 115, 0.06)',
        'heritage-lg': '0 10px 15px -3px rgba(33, 37, 41, 0.08), 0 4px 6px -2px rgba(212, 163, 115, 0.05)',
      },
    },
  },
  plugins: [],
};
