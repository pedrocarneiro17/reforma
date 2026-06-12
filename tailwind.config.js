/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page:    '#F7F4EE',
        subtle:  '#EFEAE1',
        surface: '#FFFFFF',
        raised:  '#FBFAF7',
        border:  '#E4DDD2',

        ink: {
          DEFAULT: '#171717',
          secondary: '#5F5A52',
          muted:     '#9A9286',
          faint:     '#C4BDB4',
        },

        prim: {
          DEFAULT: '#111111',
          hover:   '#2A2A2A',
          soft:    '#EFEAE1',
        },

        success: {
          DEFAULT: '#2F7D57',
          soft:    '#E7F4ED',
          border:  '#A8D5BC',
        },
        warning: {
          DEFAULT: '#B7791F',
          soft:    '#FFF4DA',
          border:  '#F4C97A',
        },
        danger: {
          DEFAULT: '#B42318',
          soft:    '#FDECEC',
          border:  '#F4A9A5',
        },
        info: {
          DEFAULT: '#315C8C',
          soft:    '#EAF1FA',
          border:  '#9BBCE0',
        },
        gold: {
          DEFAULT: '#C49A4A',
          dark:    '#8B6914',
          soft:    '#F4E8C8',
          border:  '#E0C882',
        },
      },

      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans:    ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
      },

      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },

      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        lifted: '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06)',
        input:  '0 0 0 3px rgba(196,154,74,0.14)',
        btn:    '0 2px 8px rgba(0,0,0,0.18)',
      },

      animation: {
        'fade-in':  'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },

      keyframes: {
        fadeIn:  { from: { opacity: 0 },                              to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
