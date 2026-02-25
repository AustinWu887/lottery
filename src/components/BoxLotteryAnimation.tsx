import React, { useEffect, useState, useRef } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';

interface BoxLotteryAnimationProps {
    isDrawing: boolean;
    currentWinner: number | null;
    onDrawComplete: (winner: number) => void;
}

export function BoxLotteryAnimation({ isDrawing, currentWinner, onDrawComplete }: BoxLotteryAnimationProps) {
    const { participantsCount, getDrawnNumbers } = useLotteryStore();
    const [phase, setPhase] = useState<'idle' | 'reaching' | 'grabbing' | 'pulling' | 'revealed'>('idle');
    const [displayNumber, setDisplayNumber] = useState<number | null>(null);

    useEffect(() => {
        if (isDrawing) {
            setPhase('reaching');
            setDisplayNumber(null);

            // 動畫流程控制
            setTimeout(() => setPhase('grabbing'), 600);
            setTimeout(() => {
                setPhase('pulling');
                finalizeDraw();
            }, 1800); // 延長攪拌時間
            setTimeout(() => setPhase('revealed'), 2600);

        } else if (currentWinner !== null) {
            setPhase('revealed');
            setDisplayNumber(currentWinner);
        } else {
            setPhase('idle');
            setDisplayNumber(null);
        }
    }, [isDrawing]);

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

        // 觸發完成回調，讓外部狀態更新 (延遲一點為了讓球先出來)
        setTimeout(() => {
            onDrawComplete(winner);
            fireConfetti();
        }, 800);
    };

    const fireConfetti = () => {
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
    const displayString = displayNumber === null || displayNumber === 0
        ? ''
        : String(displayNumber).padStart(padLength, '0');

    // 定義動畫變體 (Variants) 來處理複雜的關鍵影格
    const handVariants: any = {
        idle: { y: -200, opacity: 0 },
        reaching: {
            y: 40, x: 0, rotate: 0, opacity: 1,
            transition: { type: "spring", stiffness: 90, damping: 12 } as any
        },
        grabbing: {
            y: [40, 52, 40, 52, 40],
            x: [0, -20, 20, -15, 10, 0],
            rotate: [0, -15, 15, -10, 10, 0],
            opacity: 1,
            transition: {
                duration: 1.2,
                ease: "easeInOut",
                times: [0, 0.2, 0.4, 0.6, 0.8, 1]
            }
        },
        pulling: {
            y: -120, x: 0, rotate: 0, opacity: 1,
            transition: { type: "spring", stiffness: 90, damping: 12 } as any
        },
        revealed: {
            y: -150, x: 0, rotate: 0, opacity: 1,
            transition: { type: "spring", stiffness: 90, damping: 12 } as any
        }
    };

    return (
        <div className="relative w-[320px] h-[320px] flex items-end justify-center perspective-[1000px]">
            {/* 摸彩箱本體 */}
            <div className="absolute bottom-0 w-[240px] h-[180px] bg-gradient-to-br from-primary to-primary/80 rounded-b-3xl rounded-t-xl shadow-2xl border-4 border-primary/20 z-20 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
                {/* 箱子開口 (視覺暗示) */}
                <div className="absolute top-0 w-[140px] h-[30px] bg-black/40 rounded-[50%] -translate-y-1/2 blur-[2px]" />
                <img src="/273570.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none scale-150" />
            </div>

            {/* 箱子的後壁 (創造手伸進去的深度感) */}
            <div className="absolute bottom-[20px] w-[220px] h-[140px] bg-primary/90 rounded-b-2xl z-0" />

            {/* 動畫手部與球 */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-start justify-center overflow-hidden">
                <AnimatePresence>
                    {(phase === 'reaching' || phase === 'grabbing' || phase === 'pulling' || phase === 'revealed') && (
                        <motion.div
                            initial="idle"
                            animate={phase}
                            variants={handVariants}
                            className="relative flex flex-col items-center"
                        >
                            {/* 手臂 */}
                            <div className="w-[44px] h-[200px] bg-[#fde68a] border-x-4 border-[#fcd34d] rounded-b-[20px] shadow-lg relative z-20">
                                {/* 衣服袖子 */}
                                <div className="absolute top-0 inset-x-[-12px] h-[110px] bg-slate-800 rounded-b-[10px] shadow-md border-b-[6px] border-slate-900 flex justify-center">
                                    {/* 裝飾線條 */}
                                    <div className="w-[80%] h-[4px] bg-slate-700 mt-2 rounded-full" />
                                </div>
                            </div>

                            {/* 手掌 (更像手的形狀) */}
                            <div className="absolute bottom-[-22px] w-[54px] h-[48px] bg-[#fde68a] border-[3px] border-[#fcd34d] rounded-t-[10px] rounded-b-[24px] z-30 shadow-md flex justify-center gap-[3px] px-1">
                                {/* 大拇指 */}
                                <div className="absolute left-[-14px] top-[14px] w-[18px] h-[26px] bg-[#fde68a] border-[3px] border-[#fcd34d] rounded-l-[12px] rounded-r-sm rotate-[-25deg] shadow-sm z-40" />
                                {/* 其他手指暗示 */}
                                <div className="w-[12px] h-[24px] bg-[#fbbf24]/40 rounded-b-full translate-y-[22px]" />
                                <div className="w-[12px] h-[28px] bg-[#fbbf24]/40 rounded-b-full translate-y-[22px]" />
                                <div className="w-[12px] h-[26px] bg-[#fbbf24]/40 rounded-b-full translate-y-[22px]" />
                            </div>

                            {/* 抽出的球 */}
                            <AnimatePresence>
                                {(phase === 'pulling' || phase === 'revealed') && displayNumber && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0, y: 150 }}
                                        animate={{
                                            scale: phase === 'revealed' ? 1.5 : 1,
                                            opacity: 1,
                                            y: phase === 'revealed' ? 180 : 160
                                        }}
                                        transition={{
                                            type: "spring", stiffness: 200, damping: 15, delay: phase === 'revealed' ? 0.2 : 0
                                        }}
                                        className="absolute z-40 w-[80px] h-[80px] bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full shadow-2xl border-4 border-yellow-200 flex items-center justify-center transform-gpu"
                                    >
                                        <div className="absolute inset-1 bg-gradient-to-br from-white/60 to-transparent rounded-full pointer-events-none" />
                                        <span className="font-mono text-3xl font-black text-amber-900 drop-shadow-sm rotate-[-5deg]">
                                            {displayString}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
