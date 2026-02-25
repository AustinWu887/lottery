import React, { useState } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { LotteryBoard } from './components/LotteryBoard';
import { ResultView } from './components/ResultView';
import { Settings, Play, ClipboardList, RotateCcw, Trash2 } from 'lucide-react';
import { useLotteryStore } from './store/useLotteryStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'settings' | 'lottery' | 'results'>('settings');
  const { resetProgress, resetAll } = useLotteryStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('settings')}>
            <span className="text-2xl">🎉</span>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent hidden sm:block">
              Lottery System
            </h1>
          </div>

          <div className="flex p-1.5 bg-muted rounded-xl shadow-inner border border-border/50">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">設定活動</span>
            </button>
            <button
              onClick={() => setActiveTab('lottery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'lottery' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
            >
              <Play size={18} />
              <span className="hidden sm:inline">開始抽獎</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'results' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
            >
              <ClipboardList size={18} />
              <span className="hidden sm:inline">抽獎結果</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { if (confirm('確定要清除目前的抽獎進度重新抽籤嗎？(保留設定)')) resetProgress(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">重新抽獎</span>
            </button>
            <button
              onClick={() => { if (confirm('警告！這將清除所有設定與結果，確定要繼續嗎？')) resetAll(); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">全部重設</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gradient-to-b from-background to-muted/20">
        <div className="w-full">
          {activeTab === 'settings' && <SettingsPanel />}
          {activeTab === 'lottery' && <LotteryBoard />}
          {activeTab === 'results' && <ResultView />}
        </div>
      </main>
    </div>
  );
}
