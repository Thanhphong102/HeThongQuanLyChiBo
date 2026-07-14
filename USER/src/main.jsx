// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' 
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { partyTheme } from './theme'; // Dòng này cần file ở Bước 1

// Bỏ qua cảnh báo antd message khi dùng dạng static (không ảnh hưởng tính năng)
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Static function can not consume context')) {
    return;
  }
  originalError(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={partyTheme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)