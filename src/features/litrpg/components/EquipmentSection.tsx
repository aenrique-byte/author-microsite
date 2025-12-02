import React, { useState } from 'react';
import { Shield, Swords, Gem, ChevronDown, ChevronRight } from 'lucide-react';
import { LitrpgItem } from '../utils/api-litrpg';
import { EquippedItems } from '../types';

interface EquipmentSectionProps {
  equippedItems: EquippedItems;
  onEquipmentChange: (equipped: EquippedItems) => void;
  isEditable?: boolean;
  items: LitrpgItem[];
}

const SLOT_CONFIG = [
  { key: 'armor', label: 'Armor', icon: Shield, category: 'Armor', colorClass: 'text-blue-400' },
  { key: 'weapon_primary', label: 'Primary Weapon', icon: Swords, category: 'Weapon', colorClass: 'text-red-400' },
  { key: 'weapon_secondary', label: 'Secondary', icon: Swords, category: 'Weapon', colorClass: 'text-orange-400' },
] as const;

const ACCESSORY_SLOTS = [
  { key: 'accessory_1', label: 'Accessory 1' },
  { key: 'accessory_2', label: 'Accessory 2' },
  { key: 'accessory_3', label: 'Accessory 3' },
] as const;

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  equippedItems,
  onEquipmentChange,
  isEditable = true,
  items,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const allItems = items;

  const handleSlotChange = (slotKey: string, value: string) => {
    onEquipmentChange({
      ...equippedItems,
      [slotKey]: value || null,
    });
  };

  const getItemByName = (name: string | null | undefined): LitrpgItem | undefined => {
    if (!name) return undefined;
    return allItems.find(item => item.name === name);
  };

  const getFilteredItems = (category?: string): LitrpgItem[] => {
    if (!category) return allItems;
    return allItems.filter(item => item.category === category);
  };

  const renderSlotDropdown = (
    slotKey: string,
    label: string,
    currentValue: string | number | null | undefined,
    filterCategory?: string,
    icon?: React.ReactNode
  ) => {
    // Handle legacy numeric IDs - convert to string or use as is
    const currentName = typeof currentValue === 'number' ? null : currentValue;
    const currentItem = getItemByName(currentName as string);
    const availableItems = getFilteredItems(filterCategory);

    if (!isEditable) {
      return (
        <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs text-slate-500 uppercase">{label}</span>
          </div>
          <span className={`text-sm ${currentItem ? 'text-slate-200' : 'text-slate-600 italic'}`}>
            {currentItem?.name || 'Empty'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700 hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-2 min-w-[100px]">
          {icon}
          <span className="text-xs text-slate-500 uppercase whitespace-nowrap">{label}</span>
        </div>
        <div className="relative flex-1 max-w-[200px]">
          <select
            value={currentName ?? ''}
            onChange={(e) => handleSlotChange(slotKey, e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 appearance-none cursor-pointer hover:border-slate-500 focus:border-nexus-accent outline-none pr-6"
          >
            <option value="">— Empty —</option>
            {availableItems.map(item => (
              <option key={item.name} value={item.name}>
                {item.name} ({item.tech_level})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
      </div>
    );
  };

  // Count equipped items
  const equippedCount = Object.values(equippedItems).filter(v => v).length;

  return (
    <div className="bg-nexus-panel rounded-xl border border-slate-700 overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
      >
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={18} className="text-slate-500" />
          ) : (
            <ChevronRight size={18} className="text-slate-500" />
          )}
          <Swords size={18} className="text-orange-400" />
          Equipment
        </h2>
        <div className="flex items-center gap-3">
          {equippedCount > 0 && (
            <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded border border-orange-600/30">
              {equippedCount} equipped
            </span>
          )}
          {!isExpanded && allItems.length > 0 && (
            <span className="text-xs text-slate-500">{allItems.length} items</span>
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200 border-t border-slate-700/50">
          <div className="space-y-2 pt-3">
            {/* Main Equipment Slots */}
            {SLOT_CONFIG.map(slot => (
              <div key={slot.key}>
                {renderSlotDropdown(
                  slot.key,
                  slot.label,
                  equippedItems[slot.key as keyof EquippedItems],
                  slot.category,
                  <slot.icon size={14} className={slot.colorClass} />
                )}
              </div>
            ))}

            {/* Accessories Divider */}
            <div className="flex items-center gap-2 pt-2 pb-1">
              <Gem size={14} className="text-purple-400" />
              <span className="text-xs text-slate-500 uppercase tracking-wider">Accessories</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            {/* Accessory Slots */}
            {ACCESSORY_SLOTS.map(slot => (
              <div key={slot.key}>
                {renderSlotDropdown(
                  slot.key,
                  slot.label,
                  equippedItems[slot.key as keyof EquippedItems],
                  undefined, // Any item can be accessory
                  <Gem size={14} className="text-purple-400" />
                )}
              </div>
            ))}
          </div>

          {/* Equipped Stats Summary */}
          {Object.values(equippedItems).some(v => v) && (
            <div className="mt-4 pt-3 border-t border-slate-700">
              <div className="text-xs text-slate-500 mb-2">Equipped Items:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(equippedItems).map(([slot, itemValue]) => {
                  if (!itemValue) return null;
                  const itemName = typeof itemValue === 'number' ? null : itemValue;
                  const item = getItemByName(itemName);
                  if (!item) return null;
                  return (
                    <span
                      key={slot}
                      className={`text-xs px-2 py-0.5 rounded border ${
                        item.tech_level === 'TL10' ? 'bg-purple-900/20 border-purple-600 text-purple-300' :
                        item.tech_level === 'TL9' ? 'bg-blue-900/20 border-blue-600 text-blue-300' :
                        'bg-slate-800 border-slate-600 text-slate-400'
                      }`}
                    >
                      {item.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EquipmentSection;
