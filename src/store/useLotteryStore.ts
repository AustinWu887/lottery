import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Prize {
  id: string;
  name: string;
  count: number;
}

export interface LotteryState {
  participantsCount: number;
  prizes: Prize[];

  // 記錄每個獎項已經抽出的號碼
  // key 為 prize id, value 為號碼陣列
  results: Record<string, number[]>;

  // 目前正在抽的獎項 index (代表進度)
  currentPrizeIndex: number;

  // 自動連抽模式旗標
  isAutoDrawMode: boolean;
  setAutoDrawMode: (mode: boolean) => void;

  // 抽獎效果選擇
  lotteryEffect: 'slot' | 'box';
  setLotteryEffect: (effect: 'slot' | 'box') => void;

  setParticipantsCount: (count: number) => void;
  addPrize: (prize: Omit<Prize, 'id'>) => void;
  removePrize: (id: string) => void;
  updatePrize: (id: string, prize: Partial<Prize>) => void;
  setPrizeOrder: (prizes: Prize[]) => void;

  addResult: (prizeId: string, winners: number[]) => void;
  nextPrize: () => void;

  resetProgress: () => void;
  resetAll: () => void;

  // utils
  getDrawnNumbers: () => number[];
}

export const useLotteryStore = create<LotteryState>()(
  persist(
    (set, get) => ({
      participantsCount: 100,
      prizes: [
        { id: '1', name: '特獎', count: 1 },
        { id: '2', name: '頭獎', count: 1 },
        { id: '3', name: '二獎', count: 3 },
        { id: '4', name: '普獎', count: 10 },
      ],
      results: {},
      currentPrizeIndex: 0,
      isAutoDrawMode: false,
      lotteryEffect: 'slot',

      setAutoDrawMode: (mode) => set({ isAutoDrawMode: mode }),
      setLotteryEffect: (effect) => set({ lotteryEffect: effect }),

      setParticipantsCount: (count) => set({ participantsCount: count }),

      addPrize: (prize) => set((state) => ({
        prizes: [...state.prizes, { ...prize, id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 9) }]
      })),

      removePrize: (id) => set((state) => ({
        prizes: state.prizes.filter(p => p.id !== id)
      })),

      updatePrize: (id, prize) => set((state) => ({
        prizes: state.prizes.map(p => p.id === id ? { ...p, ...prize } : p)
      })),

      setPrizeOrder: (prizes) => set({ prizes }),

      addResult: (prizeId, winners) => set((state) => ({
        results: {
          ...state.results,
          [prizeId]: [...(state.results[prizeId] || []), ...winners]
        }
      })),

      nextPrize: () => set((state) => ({
        currentPrizeIndex: Math.min(state.currentPrizeIndex + 1, state.prizes.length)
      })),

      resetProgress: () => set({
        results: {},
        currentPrizeIndex: 0
      }),

      resetAll: () => set({
        participantsCount: 100,
        prizes: [],
        results: {},
        currentPrizeIndex: 0
      }),

      getDrawnNumbers: () => {
        const results = get().results;
        return Object.values(results).flat();
      }
    }),
    {
      name: 'lottery-storage',
    }
  )
);
