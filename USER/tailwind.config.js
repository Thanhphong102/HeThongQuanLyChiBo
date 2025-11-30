/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'red-dang': '#CE1126',   // Đỏ cờ
        'yellow-sao': '#FFFF00', // Vàng sao
        'red-dam': '#A30000',    // Đỏ đậm (dùng cho hover hoặc footer)
      }
    },
  },
  plugins: [],
}