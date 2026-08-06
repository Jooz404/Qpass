/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pertamina: {
          blue: '#003B73',
          'blue-dark': '#002752',
          'blue-light': '#00509A',
          green: '#74B72E',
          'green-light': '#8AD43E',
          'green-dark': '#558A1F',
          red: '#D73227',
          'red-dark': '#A31C14',
          'red-light': '#EF4A40',
          dark: '#1E293B',
          light: '#F8FAFC',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36a9f7',
          500: '#003B73',
          600: '#002752',
          700: '#001d3f',
          800: '#00152e',
          900: '#000f23',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
      opacity: {
        '82': '0.82',
        '78': '0.78',
        '86': '0.86',
        '88': '0.88',
        '26': '0.26',
      },
    },
  },
  plugins: [],
};
