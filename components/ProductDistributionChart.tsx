import React, { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { WarehouseSlot, SlotContent } from '../types';

interface ProductDistributionChartProps {
  productDistribution: Record<string, number>;
  occupiedSlots: number;
}

const ProductDistributionChart: React.FC<ProductDistributionChartProps> = ({ productDistribution, occupiedSlots }) => {
  const productData = useMemo(() => {
    const categories = [
      { type: SlotContent.FINISHED_PRODUCT, label: 'Produtos Acabados', color: 'bg-green-600' },
      { type: SlotContent.BOTTLES, label: 'Frascos', color: 'bg-blue-600' },
      { type: SlotContent.SUPPLIES, label: 'Insumos', color: 'bg-amber-600' },
      { type: 'CONTAINERS', label: 'Containers', color: 'bg-indigo-600' },
      { type: SlotContent.RETURN, label: 'Retorno', color: 'bg-red-600' },
      { type: SlotContent.REWORK, label: 'Retrabalho', color: 'bg-purple-600' },
      { type: SlotContent.REPROCESS, label: 'Reprocesso', color: 'bg-purple-600' },
      { type: SlotContent.USE_CONSUMPTION, label: 'Uso e Consumo', color: 'bg-indigo-600' },
      { type: SlotContent.MISCELLANEOUS, label: 'Diversos', color: 'bg-slate-500' },
      { type: SlotContent.DISCARD, label: 'Descarte', color: 'bg-red-700' },
      { type: 'OTHER', label: 'Outros', color: 'bg-slate-600' }
    ];

    // Total of all pallets in inventory might be different from occupied slots
    const totalPallets = (Object.values(productDistribution) as number[]).reduce((a, b) => a + b, 0);

    return categories.map(item => {
      let count = 0;
      if (item.type === 'OTHER') {
        const knownTypes = categories.filter(c => c.type !== 'OTHER' && c.type !== 'CONTAINERS').map(c => c.type);
        const containerTypes = [SlotContent.CONTAINER_SJ, SlotContent.CONTAINER_LP, SlotContent.CONTAINER_CP];
        count = Object.entries(productDistribution)
          .filter(([type]) => !knownTypes.includes(type as any) && !containerTypes.includes(type as any))
          .reduce((sum, [_, val]) => sum + (val as number), 0);
      } else if (item.type === 'CONTAINERS') {
        const containerTypes = [SlotContent.CONTAINER_SJ, SlotContent.CONTAINER_LP, SlotContent.CONTAINER_CP];
        count = Object.entries(productDistribution)
          .filter(([type]) => containerTypes.includes(type as any))
          .reduce((sum, [_, val]) => sum + (val as number), 0);
      } else {
        count = (productDistribution[item.type] as number) || 0;
      }
      
      const totalForRate = totalPallets || 1;
      const rate = Math.round((count / totalForRate) * 100);
      
      return { ...item, count, rate };
    }).filter(item => item.count > 0 || [SlotContent.BOTTLES, SlotContent.SUPPLIES, SlotContent.FINISHED_PRODUCT].includes(item.type as any));
  }, [productDistribution]);

  return (
    <div className="bg-slate-900/40 p-8 md:p-10 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h4 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Distribuição por Produto</h4>
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">Ocupação por Categoria Armazém G0</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Mix de Produtos</span>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {productData.map(item => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">{item.label}</span>
              <span className="text-[10px] font-black text-slate-400 leading-none">{item.rate}% ({item.count})</span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${item.rate}%` }}
                className={`h-full ${item.color} rounded-full`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(ProductDistributionChart);
