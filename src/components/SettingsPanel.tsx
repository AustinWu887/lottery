import React, { useState } from 'react';
import { useLotteryStore } from '../store/useLotteryStore';
import { PrizeList } from './PrizeList';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { PlusCircle, Dices, PackageOpen } from 'lucide-react';

export function SettingsPanel() {
    const participantsCount = useLotteryStore(state => state.participantsCount);
    const setParticipantsCount = useLotteryStore(state => state.setParticipantsCount);
    const addPrize = useLotteryStore(state => state.addPrize);

    const isAutoDrawMode = useLotteryStore(state => state.isAutoDrawMode);
    const setAutoDrawMode = useLotteryStore(state => state.setAutoDrawMode);

    const lotteryEffect = useLotteryStore(state => state.lotteryEffect);
    const setLotteryEffect = useLotteryStore(state => state.setLotteryEffect);

    const [newPrizeName, setNewPrizeName] = useState('');
    const [newPrizeCount, setNewPrizeCount] = useState('1');

    const handleAddPrize = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPrizeName.trim()) return;
        const count = parseInt(newPrizeCount, 10);
        if (isNaN(count) || count < 1) return;

        addPrize({ name: newPrizeName.trim(), count });
        setNewPrizeName('');
        setNewPrizeCount('1');
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">基本設定</h2>
                    <p className="text-muted-foreground text-sm flex items-center mt-1">
                        設定參與抽獎的總人數
                    </p>
                </div>

                <div className="space-y-2 pt-2">
                    <Label htmlFor="participants" className="text-base">參加總人數</Label>
                    <Input
                        id="participants"
                        type="number"
                        min="1"
                        value={participantsCount || ''}
                        onChange={(e) => setParticipantsCount(Math.max(1, parseInt(e.target.value) || 1))}
                        onFocus={() => setParticipantsCount('' as any)} // 點擊清空
                        className="w-full text-lg h-12"
                    />
                    <p className="text-sm text-primary font-medium mt-2">
                        抽獎號碼範圍將會是 1 到 {participantsCount}
                    </p>
                </div>

                <div className="pt-4 border-t mt-4">
                    <Label className="text-base mb-3 block">抽獎動畫效果</Label>
                    <RadioGroup
                        value={lotteryEffect}
                        onValueChange={(value) => setLotteryEffect(value as 'slot' | 'box')}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div>
                            <RadioGroupItem value="slot" id="effect-slot" className="peer sr-only" />
                            <Label
                                htmlFor="effect-slot"
                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                            >
                                <Dices className="mb-3 h-8 w-8" />
                                <span className="text-md font-bold">拉霸機</span>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="box" id="effect-box" className="peer sr-only" />
                            <Label
                                htmlFor="effect-box"
                                className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                            >
                                <PackageOpen className="mb-3 h-8 w-8" />
                                <span className="text-md font-bold">摸彩箱</span>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="pt-4 border-t mt-4">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="globalAutoDraw"
                            checked={isAutoDrawMode}
                            onCheckedChange={(checked) => setAutoDrawMode(checked === true)}
                            className="w-5 h-5"
                        />
                        <div className="space-y-1">
                            <Label htmlFor="globalAutoDraw" className="cursor-pointer text-base font-medium">
                                開啟全自動連續抽獎模式
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                勾選後，點擊一次抽獎系統會自動連續開獎，直到所有獎項名額抽完為止。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 bg-card p-6 md:p-8 rounded-2xl border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">獎項設定</h2>
                    <p className="text-muted-foreground text-sm flex items-center mt-1">
                        新增獎項並拖曳調整順序（越下方越先抽）
                    </p>
                </div>

                <form onSubmit={handleAddPrize} className="flex gap-4 items-end pt-2">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="prizeName">獎項名稱</Label>
                        <Input
                            id="prizeName"
                            placeholder="例如：頭獎、MacBook Pro..."
                            value={newPrizeName}
                            onChange={(e) => setNewPrizeName(e.target.value)}
                            onFocus={() => setNewPrizeName('')}
                            className="h-10"
                        />
                    </div>
                    <div className="w-24 md:w-32 space-y-2">
                        <Label htmlFor="prizeCount">得獎人數</Label>
                        <Input
                            id="prizeCount"
                            type="number"
                            min="1"
                            value={newPrizeCount}
                            onChange={(e) => setNewPrizeCount(e.target.value)}
                            onFocus={() => setNewPrizeCount('')} // 點擊清空
                            className="h-10"
                        />
                    </div>
                    <Button type="submit" disabled={!newPrizeName.trim()} className="h-10">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        新增
                    </Button>
                </form>

                <PrizeList />
            </div>
        </div>
    );
}
