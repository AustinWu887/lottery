import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import { SlotMachine } from './SlotMachine';
import { BoxLotteryAnimation } from './BoxLotteryAnimation';
import { Button } from './ui/button';
import { Trophy, PlayCircle } from 'lucide-react';

export function LotteryBoard() {
    const { prizes, currentPrizeIndex, addResult, results, nextPrize, isAutoDrawMode, lotteryEffect } = useLotteryStore();

    const [isDrawing, setIsDrawing] = useState(false);
    const [currentWinner, setCurrentWinner] = useState<number | null>(null);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const autoPlayTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const countdownRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const isAutoPlayingRef = useRef(false);

    // 決定目前要抽的獎項
    const targetPrizeIndex = prizes.length - 1 - currentPrizeIndex;
    const currentPrize = prizes[targetPrizeIndex];
    const drawnForThisPrize = currentPrize ? results[currentPrize.id] || [] : [];
    const remainCount = currentPrize ? currentPrize.count - drawnForThisPrize.length : 0;
    const isLastPrize = currentPrizeIndex === prizes.length - 1;

    // ─── 計時器工具 ───
    const cancelAllTimers = useCallback(() => {
        if (autoPlayTimerRef.current) {
            clearTimeout(autoPlayTimerRef.current);
            autoPlayTimerRef.current = undefined;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = undefined;
        }
        setCountdown(null);
    }, []);

    const scheduleTimer = useCallback((action: () => void, seconds: number) => {
        cancelAllTimers();
        setCountdown(seconds);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    countdownRef.current = undefined;
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
        autoPlayTimerRef.current = setTimeout(() => {
            cancelAllTimers();
            action();
        }, seconds * 1000);
    }, [cancelAllTimers]);

    // ─── 排程下一次抽獎（從 store 取最新狀態） ───
    const scheduleNextDraw = useCallback((seconds: number) => {
        scheduleTimer(() => {
            const state = useLotteryStore.getState();
            const ti = state.prizes.length - 1 - state.currentPrizeIndex;
            const cp = state.prizes[ti];
            if (!cp) return;
            const drawn = state.results[cp.id] || [];
            const remain = cp.count - drawn.length;
            if (remain > 0) {
                setIsDrawing(true);
                setCurrentWinner(null);
            }
        }, seconds);
    }, [scheduleTimer]);

    // ─── 排程跳下一個獎項，跳完後再排第一球 ───
    const scheduleNextPrize = useCallback((seconds: number) => {
        scheduleTimer(() => {
            nextPrize();
            // 跳完後，如果還在自動模式，排程第一球
            if (isAutoPlayingRef.current) {
                // 用 setTimeout 讓 React 先 render 完新獎項
                setTimeout(() => {
                    const state = useLotteryStore.getState();
                    const ti = state.prizes.length - 1 - state.currentPrizeIndex;
                    const cp = state.prizes[ti];
                    if (cp) {
                        const drawn = state.results[cp.id] || [];
                        const remain = cp.count - drawn.length;
                        if (remain > 0) {
                            scheduleNextDraw(10);
                        }
                    }
                }, 50);
            }
        }, seconds);
    }, [scheduleTimer, nextPrize, scheduleNextDraw]);

    // ─── 切換獎項時立即清除上一個號碼 ───
    useEffect(() => {
        setCurrentWinner(null);
        setIsDrawing(false);
    }, [currentPrizeIndex]);

    // ─── 重新抽籤時清除狀態 ───
    useEffect(() => {
        const hasResults = Object.values(results).some(arr => arr.length > 0);
        if (!hasResults) {
            setCurrentWinner(null);
            setIsDrawing(false);
            setIsAutoPlaying(false);
            isAutoPlayingRef.current = false;
            cancelAllTimers();
        }
    }, [results, cancelAllTimers]);

    // ─── 抽獎操作 ───
    const handleDraw = useCallback(() => {
        if (remainCount <= 0 || isDrawing || !currentPrize) return;
        cancelAllTimers();
        setIsDrawing(true);
        setCurrentWinner(null);
    }, [remainCount, isDrawing, currentPrize, cancelAllTimers]);

    const handleDrawComplete = (winnerNumber: number) => {
        if (!currentPrize) return;
        addResult(currentPrize.id, [winnerNumber]);
        setCurrentWinner(winnerNumber);
        setIsDrawing(false);

        // 計算抽完這球後的剩餘名額
        const newDrawn = (results[currentPrize.id] || []).length + 1;
        const newRemain = currentPrize.count - newDrawn;

        if (newRemain <= 0) {
            // 這個獎項抽完了
            if (isAutoPlayingRef.current || isLastPrize) {
                scheduleNextPrize(10);
            }
        } else if (isAutoPlayingRef.current) {
            // 還有剩餘名額，自動模式下倒數後抽下一球
            scheduleNextDraw(10);
        }
    };

    // ─── 如果所有的都播完了，取消自動播放狀態 ───
    useEffect(() => {
        if (currentPrizeIndex >= prizes.length && isAutoPlaying) {
            setIsAutoPlaying(false);
            isAutoPlayingRef.current = false;
        }
    }, [currentPrizeIndex, prizes.length, isAutoPlaying]);

    // ─── 防止手機或平板螢幕在抽獎期間休眠 ───
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                }
            } catch (err) {
                console.log('Wake Lock Error:', err);
            }
        };
        requestWakeLock();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') requestWakeLock();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            wakeLock?.release()?.catch(() => { });
        };
    }, []);

    const toggleAutoPlay = () => {
        if (!isAutoPlaying) {
            setIsAutoPlaying(true);
            isAutoPlayingRef.current = true;
            // 立即觸發第一次抽獎
            if (!isDrawing && remainCount > 0) {
                handleDraw();
            }
        } else {
            setIsAutoPlaying(false);
            isAutoPlayingRef.current = false;
            cancelAllTimers();
        }
    };

    if (prizes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border shadow-sm max-w-2xl mx-auto h-[500px]">
                <Trophy size={48} className="text-muted/30 mb-4" />
                <p className="text-xl text-muted-foreground font-medium text-center">尚未設定任何獎項</p>
            </div>
        );
    }

    if (currentPrizeIndex >= prizes.length || !currentPrize) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-primary/20 shadow-lg max-w-2xl mx-auto h-[500px] animate-in zoom-in-95 duration-700">
                <div className="bg-primary/10 p-6 rounded-full mb-6">
                    <Trophy size={64} className="text-primary animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">恭喜！所有獎項已抽完</h2>
                <p className="text-muted-foreground">您可以前往「結果清單」查看完整中獎名單</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-start p-4 pt-6 md:p-12 bg-card rounded-3xl border shadow-md max-w-2xl mx-auto min-h-[500px] animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
            {/* 背景光暈效果 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-primary/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6 text-primary drop-shadow-sm">
                <img src={`${__BASE_PATH__}/274262.jpg`} alt="" className="w-7 h-7 md:w-9 md:h-9 object-contain" />
                <h2 className="text-3xl md:text-4xl font-black tracking-widest leading-none">{currentPrize.name}</h2>
                <img src={`${__BASE_PATH__}/274262.jpg`} alt="" className="w-7 h-7 md:w-9 md:h-9 object-contain" />
            </div>

            <div className="mb-4 md:mb-8 bg-muted/50 px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-border/50 text-muted-foreground font-semibold flex items-center gap-2 text-sm md:text-base">
                <span>總共 {currentPrize.count} 名</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-foreground">剩餘 {remainCount} 名</span>
            </div>

            <div className="my-2 md:my-4 scale-[0.75] md:scale-100 origin-top h-[240px] md:h-auto flex items-center justify-center">
                {lotteryEffect === 'slot' ? (
                    <SlotMachine
                        isDrawing={isDrawing}
                        currentWinner={currentWinner}
                        onDrawComplete={handleDrawComplete}
                    />
                ) : (
                    <BoxLotteryAnimation
                        isDrawing={isDrawing}
                        currentWinner={currentWinner}
                        onDrawComplete={handleDrawComplete}
                    />
                )}
            </div>


            <div className="flex gap-3 md:gap-4 mt-2 md:mt-6 z-10 relative pl-2 pr-2">
                <Button
                    size="lg"
                    className="text-lg md:text-2xl h-14 md:h-16 px-6 md:px-12 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all w-full max-w-[280px]"
                    onClick={isAutoDrawMode ? toggleAutoPlay : handleDraw}
                    disabled={isAutoPlaying || isDrawing || remainCount === 0}
                >
                    <PlayCircle className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                    Ready! Set! GO!
                </Button>

                {!isAutoPlaying && !isLastPrize && remainCount === 0 && (
                    <Button
                        size="lg"
                        variant="outline"
                        className="text-lg md:text-xl h-14 md:h-16 px-6 md:px-8 rounded-full font-bold border-2 animate-in slide-in-from-left-4 fade-in whitespace-nowrap"
                        onClick={nextPrize}
                    >
                        下一個獎項
                    </Button>
                )}
            </div>

            {drawnForThisPrize.length > 0 && (
                <div className="mt-6 md:mt-10 w-full pt-6 md:pt-8 border-t border-border/50 relative">
                    <h3 className="text-xs md:text-sm font-bold text-muted-foreground mb-4 text-center uppercase tracking-widest">目前中獎號碼</h3>
                    {/* 一排 5 個小方塊 (手機) / 一排 10 個 (平版以上) */}
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3 justify-center max-w-full">
                        {drawnForThisPrize.map((num, i) => (
                            <div
                                key={i}
                                className="bg-background text-foreground border-2 border-primary/30 rounded-xl md:rounded-2xl font-black text-lg md:text-2xl shadow-sm animate-in fade-in zoom-in slide-in-from-bottom-2 aspect-square flex items-center justify-center leading-none"
                                style={{ animationDelay: `${i * 30}ms`, animationFillMode: 'both' }}
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
