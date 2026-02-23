/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#090914',
        'dark-card': '#0f0f23',
        'neon-purple': '#7C5CFC',
        'neon-blue': '#00D4FF',
        'neon-green': '#00C896',
        'neon-pink': '#FF6B9D',
        'text-secondary': '#8B8FA8',
        'text-muted': '#4A4D6B',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(124, 92, 252, 0.3)',
        'glow-blue': '0 0 30px rgba(0, 212, 255, 0.3)',
        'glow-green': '0 0 30px rgba(0, 200, 150, 0.2)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
    },
  },
  plugins: [],
}
