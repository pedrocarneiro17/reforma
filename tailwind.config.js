/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidade Contajur (mesmo padrão do Tarefas): fundo branco, marinho pleno e o vermelho da marca como contraste.
        page:    '#FFFFFF',
        subtle:  '#EBEDF0',
        surface: '#FFFFFF',
        raised:  '#F5F6F7',
        border:  '#D9DDE3',

        ink: {
          DEFAULT: '#161B22',
          secondary: '#4E5865',
          muted:     '#6C7684',
          faint:     '#AFB7C0',
        },

        prim: {
          DEFAULT: '#15335B',
          hover:   '#284267',
          soft:    '#EBEDF0',
        },

        marca: {
          DEFAULT: '#A22029',
          soft:    '#FFE7E5',
          border:  '#FEAAA4',
        },

        success: {
          DEFAULT: '#005221',
          soft:    '#E2F4E4',
          border:  '#9CD3A7',
        },
        warning: {
          DEFAULT: '#573D00',
          soft:    '#F7ECD9',
          border:  '#E1BF84',
        },
        danger: {
          DEFAULT: '#7E0214',
          soft:    '#FFE7E5',
          border:  '#FEAAA4',
        },
        info: {
          DEFAULT: '#004766',
          soft:    '#DEF1FC',
          border:  '#93CEF0',
        },
        // "gold" era o destaque dourado; agora é o marinho claro (destaque sem competir com o vermelho de alerta).
        gold: {
          DEFAULT: '#234F85',
          dark:    '#15335B',
          soft:    '#EBEDF0',
          border:  '#D9DDE3',
        },
      },

      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.06em' }],
      },

      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '18px',
        '2xl': '18px',
      },

      boxShadow: {
        card:   'none',
        lifted: 'none',
        input:  '0 0 0 3px rgba(21,51,91,0.18)',
        btn:    'none',
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
