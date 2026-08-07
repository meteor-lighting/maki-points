import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AdminModal } from './components/AdminModal';
import { PersonalStatsModal } from './components/PersonalStatsModal';
import { Toast } from './components/Toast';

import { HomeView } from './views/HomeView';
import { CreateMeetingView } from './views/CreateMeetingView';
import { StatisticsView } from './views/StatisticsView';
import { ExchangeView } from './views/ExchangeView';

export function AppContent() {
  const { currentView } = useApp();

  return (
    <div className="app-container">
      {/* Background Animated Glows */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      {/* Navigation Header */}
      <Header />

      {/* Main View Router */}
      <main className="container">
        {currentView === 'home' && <HomeView />}
        {currentView === 'create' && <CreateMeetingView />}
        {currentView === 'recording' && <CreateMeetingView />}
        {currentView === 'stats' && <StatisticsView />}
        {currentView === 'exchange' && <ExchangeView />}
      </main>

      {/* Modals & Toast */}
      <AdminModal />
      <PersonalStatsModal />
      <Toast />
    </div>
  );
}

export default AppContent;
