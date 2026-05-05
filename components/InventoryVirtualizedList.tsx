import React, { memo, useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import InventoryCard from './InventoryCard';
import { SheetRow, InspectionData } from '../types';

interface InventoryVirtualizedListProps {
  items: { row: SheetRow, inspection: InspectionData, idx: number }[];
  selectedPallets: string[];
  onToggleSelection: (rowId: string, palletIdx: number) => void;
  onShowDetail: (row: SheetRow, inspection: InspectionData, idx: number) => void;
  onEdit: (row: SheetRow, inspection: InspectionData, idx: number) => void;
  onDelete: (rowId: string, idx: number) => void;
}

const InventoryVirtualizedList: React.FC<InventoryVirtualizedListProps> = ({
  items,
  selectedPallets,
  onToggleSelection,
  onShowDetail,
  onEdit,
  onDelete
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  
  useEffect(() => {
    if (!parentRef.current) return;
    
    // Initial width
    setWidth(parentRef.current.offsetWidth);

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    
    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  const itemsPerRow = width >= 1280 ? 3 : width >= 640 ? 2 : 1;
  const rowCount = Math.ceil(items.length / itemsPerRow);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 520, // Altura estimada do card + gaps
    overscan: 3,
  });

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-380px)] overflow-auto px-1 scroll-smooth"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const rowItems = [];
          
          for (let i = 0; i < itemsPerRow; i++) {
            const itemIndex = rowIndex * itemsPerRow + i;
            if (itemIndex < items.length) {
              rowItems.push(items[itemIndex]);
            }
          }

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                gap: '1.5rem', // Correspondente a gap-6 do Tailwind
              }}
              className="py-3"
            >
              {rowItems.map(({ row, inspection, idx }) => (
                <div key={`${row.id}::${idx}`} className="flex-1 min-w-0">
                  <InventoryCard
                    item={row}
                    insp={inspection}
                    idx={idx}
                    isSelected={selectedPallets.includes(`${row.id}::${idx}`)}
                    onToggleSelection={onToggleSelection}
                    onShowDetail={onShowDetail}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}
              {/* Preenchimento para manter o grid alinhado na última linha */}
              {rowItems.length < itemsPerRow && 
                Array.from({ length: itemsPerRow - rowItems.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 min-w-0" />
                ))
              }
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(InventoryVirtualizedList);
