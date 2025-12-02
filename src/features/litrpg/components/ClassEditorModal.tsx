import React, { useState, useMemo } from 'react';
import { X, Swords, Info } from 'lucide-react';
import { getAllClasses } from '../class-constants';
import { getTierColorByNumber } from '../tier-constants';

interface ClassEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AttributeKey = 'STR' | 'PER' | 'DEX' | 'MEM' | 'INT' | 'CHA';
const ATTRIBUTES: AttributeKey[] = ['STR', 'PER', 'DEX', 'MEM', 'INT', 'CHA'];

const ATTRIBUTE_NAMES: Record<AttributeKey, string> = {
  STR: 'Strength',
  PER: 'Perception',
  DEX: 'Dexterity',
  MEM: 'Memory',
  INT: 'Intelligence',
  CHA: 'Charisma'
};

export const ClassEditorModal: React.FC<ClassEditorModalProps> = ({ isOpen, onClose }) => {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  
  // Load classes from constants
  const classes = useMemo(() => getAllClasses(), []);

  // Auto-select first class
  React.useEffect(() => {
    if (isOpen && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [isOpen, classes, selectedClassId]);

  const selectedClass = useMemo(() => 
    classes.find(c => c.id === selectedClassId), 
    [classes, selectedClassId]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-nexus-panel border border-slate-600 shadow-2xl rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3">
            <Swords className="text-orange-400" size={24} />
            <div>
              <h2 className="text-lg font-bold text-white">Class Viewer</h2>
              <p className="text-xs text-slate-400">View class properties and stat bonuses (read-only)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2 text-sm bg-blue-900/20 text-blue-400 border-b border-blue-900/30 flex items-center gap-2">
          <Info size={16} />
          Classes are now managed via constants files (class-constants.ts). Edit the file directly to modify classes.
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Class List */}
          <div className="w-64 border-r border-slate-700 bg-slate-900/50 flex flex-col">
            <div className="p-2 border-b border-slate-800">
              <span className="text-xs text-slate-500 uppercase tracking-wide">Classes ({classes.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`w-full text-left px-3 py-2 border-b border-slate-800 transition-colors ${
                    selectedClassId === cls.id 
                      ? 'bg-orange-500/10 border-l-2 border-l-orange-500 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                    <span className={`px-1 rounded ${getTierColorByNumber(cls.tier)}`}>Tier {cls.tier}</span>
                    <span>Lvl {cls.unlockLevel}+</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Class Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedClass ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase mb-1">Name</label>
                    <div className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-white">
                      {selectedClass.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase mb-1">Tier</label>
                    <div className={`w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 ${getTierColorByNumber(selectedClass.tier)}`}>
                      Tier {selectedClass.tier}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 uppercase mb-1">Description</label>
                  <div className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-slate-300 min-h-[80px]">
                    {selectedClass.description || 'No description'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase mb-1">Unlock Level</label>
                    <div className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-white">
                      Level {selectedClass.unlockLevel}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase mb-1">Prerequisite Class ID</label>
                    <div className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-2 text-white">
                      {selectedClass.prerequisiteClassId || 'None'}
                    </div>
                  </div>
                </div>

                {/* Primary & Secondary Attributes */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold text-orange-400 mb-3">Combat Attributes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 uppercase mb-1">Primary Attribute</label>
                      <div className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white">
                        {selectedClass.primaryAttribute ? 
                          `${selectedClass.primaryAttribute} - ${ATTRIBUTE_NAMES[selectedClass.primaryAttribute as AttributeKey] || selectedClass.primaryAttribute}` 
                          : 'Not Set'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 uppercase mb-1">Secondary Attribute</label>
                      <div className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white">
                        {selectedClass.secondaryAttribute ? 
                          `${selectedClass.secondaryAttribute} - ${ATTRIBUTE_NAMES[selectedClass.secondaryAttribute as AttributeKey] || selectedClass.secondaryAttribute}` 
                          : 'Not Set'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stat Bonuses */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <h3 className="text-sm font-bold text-green-400 mb-3">Stat Bonuses</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {ATTRIBUTES.map(attr => (
                      <div key={attr} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded border border-slate-700">
                        <span className="text-xs text-slate-400">{attr}</span>
                        <span className={`font-mono ${(selectedClass.statBonuses?.[attr] || 0) > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                          {selectedClass.statBonuses?.[attr] ? `+${selectedClass.statBonuses[attr]}` : '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ability IDs */}
                {selectedClass.abilityIds && selectedClass.abilityIds.length > 0 && (
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-bold text-purple-400 mb-3">Assigned Ability IDs</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedClass.abilityIds.map(id => (
                        <span key={id} className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs font-mono">
                          #{id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600">
                Select a class from the left
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
