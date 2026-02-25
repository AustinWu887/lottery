import React, { useState } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import { Button } from './ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';

export function ResultView() {
    const { prizes, results } = useLotteryStore();
    const [copied, setCopied] = useState(false);

    // 整理結果呈現，順序可以照大獎到小獎顯示
    const resultsList = prizes.map(prize => ({
        ...prize,
        winners: results[prize.id] || []
    }));

    const handleCopy = () => {
        let text = '🎉 抽獎結果 🎉\n\n';

        resultsList.forEach(item => {
            text += `【${item.name}】共 ${item.count} 名\n`;
            if (item.winners.length > 0) {
                text += `得獎號碼：${item.winners.join(', ')}\n`;
            } else {
                text += `尚無得獎者\n`;
            }
            text += '\n';
        });

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const hasAnyResults = Object.values(results).some(arr => arr.length > 0);

    if (!hasAnyResults) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border shadow-sm max-w-2xl mx-auto h-[400px]">
                <p className="text-xl text-muted-foreground font-medium">目前尚無抽獎紀錄</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-card rounded-3xl border shadow-md max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
                <h2 className="text-3xl font-bold tracking-tight">抽獎結果</h2>
                <Button onClick={handleCopy} variant={copied ? "default" : "outline"} className="gap-2 transition-all">
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copied ? '已複製' : '複製結果'}
                </Button>
            </div>

            <div className="space-y-8 mb-10">
                {resultsList.map((item) => (
                    <div key={item.id} className="bg-muted/30 p-6 rounded-2xl border border-border/50 transition-all hover:bg-muted/50">
                        <div className="flex items-end gap-3 mb-4">
                            <h3 className="text-2xl font-bold text-primary">{item.name}</h3>
                            <span className="text-muted-foreground mb-1 text-sm">/ {item.count}名</span>
                        </div>

                        {item.winners.length > 0 ? (
                            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3 justify-center max-w-full">
                                {item.winners.map((num, i) => (
                                    <div key={i} className="bg-background text-foreground border-2 border-primary/30 rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-sm aspect-square flex items-center justify-center leading-none">
                                        {num}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-sm">尚未抽出</p>
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
}
