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
    const autoPlayTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // 決定目前要抽的獎項
    const targetPrizeIndex = prizes.length - 1 - currentPrizeIndex;
    const currentPrize = prizes[targetPrizeIndex];
    const drawnForThisPrize = currentPrize ? results[currentPrize.id] || [] : [];
    const remainCount = currentPrize ? currentPrize.count - drawnForThisPrize.length : 0;

    const handleDraw = useCallback(() => {
        if (remainCount <= 0 || isDrawing || !currentPrize) return;
        setIsDrawing(true);
        setCurrentWinner(null);
    }, [remainCount, isDrawing, currentPrize]);

    const handleDrawComplete = (winnerNumber: number) => {
        if (!currentPrize) return;
        addResult(currentPrize.id, [winnerNumber]);
        setCurrentWinner(winnerNumber);
        setIsDrawing(false);
    };

    // 自動連抽邏輯
    useEffect(() => {
        if (!currentPrize) return;

        if (remainCount <= 0 && isAutoPlaying) {
            // 這個獎項抽完了，自動進入下一個獎項
            autoPlayTimerRef.current = setTimeout(() => {
                nextPrize();
            }, 2500); // UI 緩衝 2.5 秒切換獎項
        } else if (isAutoPlaying && !isDrawing) {
            // 這個獎項還有剩額，且目前不在抽獎動畫中，自動開下一球
            autoPlayTimerRef.current = setTimeout(() => {
                handleDraw();
            }, 2000); // 每次拉霸動畫結束後，停頓 2 秒再抽下一個
        }

        return () => {
            if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        };
    }, [isDrawing, remainCount, isAutoPlaying, nextPrize, currentPrize, handleDraw]);

    // 如果所有的都播完了，取消自動播放狀態
    useEffect(() => {
        if (currentPrizeIndex >= prizes.length && isAutoPlaying) {
            setIsAutoPlaying(false);
        }
    }, [currentPrizeIndex, prizes.length, isAutoPlaying]);

    // 防止手機或平板螢幕在抽獎期間休眠
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
            // 立即觸發第一次抽獎
            if (!isDrawing && remainCount > 0) {
                handleDraw();
            }
        } else {
            setIsAutoPlaying(false);
            if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
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
                <Trophy className="text-primary/80 w-7 h-7 md:w-9 md:h-9" />
                <h2 className="text-3xl md:text-4xl font-black tracking-widest leading-none">{currentPrize.name}</h2>
                <Trophy className="text-primary/80 w-7 h-7 md:w-9 md:h-9" />
            </div>

            <div className="mb-4 md:mb-8 bg-muted/50 px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-border/50 text-muted-foreground font-semibold flex items-center gap-2 text-sm md:text-base">
                <span>總共 {currentPrize.count} 名</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-foreground">剩餘 {remainCount} 名</span>
            </div>

            <div className="my-6 md:my-8 scale-[0.75] md:scale-100 origin-top h-[240px] md:h-auto flex items-center justify-center">
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
                {isAutoDrawMode ? (
                    <Button
                        size="lg"
                        variant={isAutoPlaying ? "destructive" : "default"}
                        className="text-lg md:text-2xl h-14 md:h-16 px-6 md:px-12 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all w-full max-w-[280px]"
                        onClick={toggleAutoPlay}
                        disabled={remainCount === 0 && !isAutoPlaying}
                    >
                        {isAutoPlaying ? '停止自動抽獎' : (
                            <>
                                <PlayCircle className="mr-2 h-5 w-5 md:h-6 md:w-6" />
                                自動連續抽獎
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className="text-xl md:text-2xl h-14 md:h-16 px-8 md:px-12 rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 min-w-[200px]"
                        onClick={handleDraw}
                        disabled={isDrawing || remainCount === 0}
                    >
                        {isDrawing ? '抽獎中...' : '開始抽獎'}
                    </Button>
                )}

                {!isAutoPlaying && remainCount === 0 && (
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
