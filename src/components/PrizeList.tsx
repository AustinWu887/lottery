import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLotteryStore, Prize } from '../store/useLotteryStore';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

function SortableItem({ prize, onRemove }: { prize: Prize, onRemove: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: prize.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-md shadow-sm mb-2 hover:border-primary/50 transition-colors">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical size={20} />
            </div>
            <div className="flex-1 font-medium">{prize.name}</div>
            <div className="text-sm text-muted-foreground w-20 text-right">{prize.count} 名</div>
            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onRemove(prize.id)}>
                <Trash2 size={16} />
            </Button>
        </div>
    );
}

export function PrizeList() {
    const prizes = useLotteryStore((state) => state.prizes);
    const setPrizeOrder = useLotteryStore((state) => state.setPrizeOrder);
    const removePrize = useLotteryStore((state) => state.removePrize);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = prizes.findIndex((p) => p.id === active.id);
            const newIndex = prizes.findIndex((p) => p.id === over.id);

            setPrizeOrder(arrayMove(prizes, oldIndex, newIndex));
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={prizes.map(p => p.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">獎項列表 (由上至下顯示，抽獎時從最底下的小獎開始抽)</h3>
                    {prizes.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center p-8 border rounded-md border-dashed bg-muted/50">
                            目前尚無設定任何獎項
                        </div>
                    ) : (
                        prizes.map((prize) => (
                            <SortableItem key={prize.id} prize={prize} onRemove={removePrize} />
                        ))
                    )}
                </div>
            </SortableContext>
        </DndContext>
    );
}
