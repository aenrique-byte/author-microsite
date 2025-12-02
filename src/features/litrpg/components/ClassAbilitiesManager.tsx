import React, { useState, useMemo } from 'react';
import { X, Zap, Search } from 'lucide-react';
import { getAllClasses } from '../class-constants';
import { getAllAbilities, ExportedAbility, getAbilityById } from '../ability-constants';

interface ClassAbilitiesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClassAbilitiesManager: React.FC<ClassAbilitiesManagerProps> = ({ isOpen, onClose }) => {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [abilitySearch, setAbilitySearch] = useState('');

  // Load data from constants
  const classes = useMemo(() => getAllClasses(), []);
  const abilitiesArray = useMemo(() => getAllAbilities(), []);

  // Auto-select first class if none selected
  React.useEffect(() => {
    if (isOpen && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [isOpen, classes, selectedClassId]);

  const selectedClass = useMemo(() => 
    classes.find(c => c.id === selectedClassId), 
    [classes, selectedClassId]
  );
  
  // Get abilities assigned to this class from constants
  const classAbilities = useMemo(() => {
    if (!selectedClass?.abilityIds) return [];
    return selectedClass.abilityIds
      .map(id => getAbilityById(id))
      .filter((a): a is ExportedAbility => a !== undefined);
  }, [selectedClass]);

  // All abilities not assigned to this class
  const availableAbilities = useMemo(() => {
    const assignedIds = new Set(selectedClass?.abilityIds || []);
    return abilitiesArray
      .filter(a => !assignedIds.has(a.id))
      .filter(a => !abilitySearch || a.name.toLowerCase().includes(abilitySearch.toLowerCase()));
  }, [abilitiesArray, selectedClass, abilitySearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-nexus-panel border border-slate-600 shadow-2xl rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3">
            <Zap className="text-yellow-400" size={24} />
            <div>
              <h2 className="text-lg font-bold text-white">Class Ability Viewer</h2>
              <p className="text-xs text-slate-400">View class-ability assignments (read-only)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2 text-sm bg-blue-900/20 text-blue-400 border-b border-blue-900/30">
          ℹ️ Class abilities are now managed via constants files (class-constants.ts). Edit the abilityIds array to modify assignments.
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Class List */}
          <div className="w-56 border-r border-slate-700 bg-slate-900/50 overflow-y-auto">
            <div className="p-2 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-800">
              Select Class
            </div>
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`w-full text-left px-3 py-2 border-b border-slate-800 transition-colors ${
                  selectedClassId === cls.id 
                    ? 'bg-nexus-accent/10 border-l-2 border-l-nexus-accent text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="font-medium">{cls.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">Tier {cls.tier} • Lvl {cls.unlockLevel}+</div>
              </button>
            ))}
          </div>

          {/* Right: Ability View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedClass ? (
              <>
                {/* Selected Class Info */}
                <div className="p-4 bg-slate-900/80 border-b border-slate-700">
                  <h3 className="text-lg font-bold text-white">{selectedClass.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{selectedClass.description || 'No description'}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    {classAbilities.length} abilities assigned
                  </div>
                </div>

                {/* Two Panels: Assigned / All Others */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Assigned Abilities */}
                  <div className="flex-1 flex flex-col border-r border-slate-700">
                    <div className="p-2 text-xs text-slate-500 uppercase tracking-wide bg-slate-900 border-b border-slate-800">
                      Assigned Abilities ({classAbilities.length})
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {classAbilities.length === 0 ? (
                        <div className="text-center text-slate-600 py-8 text-sm">
                          No abilities assigned to this class.
                        </div>
                      ) : (
                        classAbilities.map(ability => (
                          <div 
                            key={ability.id}
                            className="flex items-center justify-between p-2 bg-green-900/20 rounded border border-green-700/30"
                          >
                            <div>
                              <div className="font-medium text-slate-200">{ability.name}</div>
                              <div className="text-[10px] text-slate-500">
                                ID: {ability.id} • Max Level: {ability.maxLevel || 5}
                              </div>
                            </div>
                            <span className="text-xs text-green-400">✓</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Other Abilities */}
                  <div className="flex-1 flex flex-col">
                    <div className="p-2 bg-slate-900 border-b border-slate-800">
                      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                        Other Abilities
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search abilities..."
                          value={abilitySearch}
                          onChange={(e) => setAbilitySearch(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-sm text-white focus:border-nexus-accent outline-none"
                        />
                        <Search className="absolute left-2 top-2 text-slate-500" size={14} />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {availableAbilities.length === 0 ? (
                        <div className="text-center text-slate-600 py-8 text-sm">
                          {abilitySearch ? 'No matching abilities.' : 'All abilities are assigned!'}
                        </div>
                      ) : (
                        availableAbilities.map(ability => (
                          <div
                            key={ability.id}
                            className="p-2 bg-slate-800/50 rounded border border-slate-700 text-left"
                          >
                            <div className="font-medium text-slate-400">{ability.name}</div>
                            <div className="text-[10px] text-slate-600">
                              ID: {ability.id} • Max Level: {ability.maxLevel || 5}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-slate-600">
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
