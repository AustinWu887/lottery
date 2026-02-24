import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import { SlotMachine } from './SlotMachine';
import { Button } from './ui/button';
import { Trophy, PlayCircle } from 'lucide-react';

export function LotteryBoard() {
    const { prizes, currentPrizeIndex, addResult, results, nextPrize, isAutoDrawMode } = useLotteryStore();

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
        <div className="flex flex-col items-center justify-start p-8 md:p-12 bg-card rounded-3xl border shadow-md max-w-2xl mx-auto min-h-[500px] animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
            {/* 背景光暈效果 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] bg-primary/5 rounded-full blur-3xl -z-10" />

            <div className="flex items-center justify-center gap-3 mb-6 text-primary drop-shadow-sm">
                <Trophy size={36} className="text-primary/80" />
                <h2 className="text-4xl font-black tracking-widest">{currentPrize.name}</h2>
                <Trophy size={36} className="text-primary/80" />
            </div>

            <div className="mb-8 bg-muted/50 px-6 py-2 rounded-full border border-border/50 text-muted-foreground font-semibold flex items-center gap-2">
                <span>總共 {currentPrize.count} 名</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-foreground">剩餘 {remainCount} 名</span>
            </div>

            <div className="my-6">
                <SlotMachine
                    isDrawing={isDrawing}
                    currentWinner={currentWinner}
                    onDrawComplete={handleDrawComplete}
                />
            </div>

            <div className="flex gap-4 mt-6">
                {isAutoDrawMode ? (
                    <Button
                        size="lg"
                        variant={isAutoPlaying ? "destructive" : "default"}
                        className="text-2xl h-16 px-12 rounded-full font-bold shadow-xl hover:shadow-2xl transition-all"
                        onClick={toggleAutoPlay}
                        disabled={remainCount === 0 && !isAutoPlaying}
                    >
                        {isAutoPlaying ? '停止自動抽獎' : (
                            <>
                                <PlayCircle className="mr-2 h-6 w-6" />
                                自動連續抽獎
                            </>
                        )}
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        className="text-2xl h-16 px-12 rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
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
                        className="text-xl h-16 px-8 rounded-full font-bold border-2 animate-in slide-in-from-left-4 fade-in"
                        onClick={nextPrize}
                    >
                        下一個獎項
                    </Button>
                )}
            </div>

            {drawnForThisPrize.length > 0 && (
                <div className="mt-12 w-full pt-8 border-t border-border/50 relative">
                    <h3 className="text-sm font-bold text-muted-foreground mb-6 text-center uppercase tracking-widest">目前中獎號碼</h3>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {drawnForThisPrize.map((num, i) => (
                            <div
                                key={i}
                                className="bg-background text-foreground border-2 border-primary/30 px-5 py-3 rounded-xl font-black text-2xl shadow-sm animate-in fade-in zoom-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
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
