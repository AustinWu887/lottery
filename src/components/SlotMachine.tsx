import React, { useEffect, useState, useRef } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import confetti from 'canvas-confetti';

interface SlotMachineProps {
    isDrawing: boolean;
    currentWinner: number | null;
    onDrawComplete: (winner: number) => void;
}

export function SlotMachine({ isDrawing, currentWinner, onDrawComplete }: SlotMachineProps) {
    const { participantsCount, getDrawnNumbers } = useLotteryStore();
    const [displayNumber, setDisplayNumber] = useState<number>(0);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        if (isDrawing) {
            let speed = 40;
            const startTime = Date.now();
            const DURATION = 2500; // 動畫總長時間

            const roll = () => {
                const now = Date.now();
                const elapsed = now - startTime;

                if (elapsed < DURATION) {
                    // 動畫中，不斷隨機顯示數字，營造轉動感
                    setDisplayNumber(Math.floor(Math.random() * participantsCount) + 1);
                    animationRef.current = window.setTimeout(roll, speed);

                    // 後半段時間逐漸減速 (Easing out)
                    if (elapsed > DURATION * 0.7) speed = 80;
                    if (elapsed > DURATION * 0.85) speed = 150;
                    if (elapsed > DURATION * 0.95) speed = 300;
                } else {
                    // 時間到，產生最終結果
                    finalizeDraw();
                }
            };

            roll();

            return () => {
                if (animationRef.current) clearTimeout(animationRef.current);
            };
        } else if (currentWinner !== null) {
            setDisplayNumber(currentWinner);
        } else {
            setDisplayNumber(0);
        }
    }, [isDrawing, currentWinner]);

    const finalizeDraw = () => {
        const drawnNumbers = getDrawnNumbers();
        const availableNumbers = [];

        // 找出所有還未被抽中過的號碼
        for (let i = 1; i <= participantsCount; i++) {
            if (!drawnNumbers.includes(i)) {
                availableNumbers.push(i);
            }
        }

        if (availableNumbers.length === 0) {
            alert('所有號碼都已抽完！無法再抽出得獎者。');
            onDrawComplete(0);
            return;
        }

        // 從剩下的號碼中隨機抽一個
        const winnerIndex = Math.floor(Math.random() * availableNumbers.length);
        const winner = availableNumbers[winnerIndex];

        setDisplayNumber(winner);
        onDrawComplete(winner);

        // 噴發彩帶效果
        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const padLength = Math.max(2, String(participantsCount).length);
    const displayString = displayNumber === 0
        ? '?'
        : String(displayNumber).padStart(padLength, '0');

    return (
        <div className="relative overflow-hidden bg-gradient-to-b from-card to-muted border-[6px] border border-primary/20 rounded-3xl w-[320px] h-[180px] flex items-center justify-center shadow-[inset_0_10px_20px_rgba(0,0,0,0.1)]">
            {/* 上下邊緣陰影做出滾輪的立體感 */}
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none" />

            {/* 左右金屬質感邊緣 */}
            <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-black/10 to-transparent z-10" />
            <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-black/10 to-transparent z-10" />

            <div className="relative z-0 font-mono text-[100px] leading-none font-black tracking-tighter text-primary">
                <span className={isDrawing ? "blur-[1.5px] opacity-70" : "animate-in zoom-in-110 duration-500 drop-shadow-xl inline-block"}>
                    {displayString}
                </span>
            </div>
        </div>
    );
}
