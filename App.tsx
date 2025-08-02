
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import UserTestPage from './pages/UserTestPage';
import AdminPage from './pages/AdminPage';

const Header = () => (
  <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
    <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center space-x-2 group">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent group-hover:from-primary-700 group-hover:to-primary-900 dark:group-hover:from-primary-300 dark:group-hover:to-primary-500 transition-all duration-300">
          AISkillsTest
        </span>
      </Link>
      <div className="flex items-center space-x-6">
        <Link 
          to="/admin" 
          className="relative px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-all duration-300 group"
        >
          <span className="relative z-10">관리자</span>
          <div className="absolute inset-0 bg-primary-50 dark:bg-primary-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      </div>
    </nav>
  </header>
);

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<UserTestPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <footer className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200/50 dark:border-gray-700/50">
        <p>&copy; 2025 AISkillsTest. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
