import React, { useState, useMemo, useEffect } from 'react';
import { X, Zap, Search, Loader2, Plus, Minus } from 'lucide-react';
import { getCachedClasses, getCachedAbilities, updateClassAbilities, LitrpgClass, LitrpgAbility } from '../utils/api-litrpg';
import { useAuth } from '../../../contexts/AuthContext';

interface ClassAbilitiesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClassAbilitiesManager: React.FC<ClassAbilitiesManagerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [abilitySearch, setAbilitySearch] = useState('');
  const [classes, setClasses] = useState<LitrpgClass[]>([]);
  const [abilitiesArray, setAbilitiesArray] = useState<LitrpgAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setStatus(null);
      const [cls, ab] = await Promise.all([getCachedClasses(), getCachedAbilities()]);
      setClasses(cls);
      setAbilitiesArray(ab);
      if (!selectedClassId && cls.length > 0) {
        setSelectedClassId(cls[0].id);
      }
      setLoading(false);
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedClassId]);

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId]);

  const classAbilities = useMemo(() => {
    if (!selectedClass?.ability_ids) return [];
    return selectedClass.ability_ids
      .map((id) => abilitiesArray.find((a) => a.id === id))
      .filter((a): a is LitrpgAbility => Boolean(a))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedClass, abilitiesArray]);

  const availableAbilities = useMemo(() => {
    const assignedIds = new Set(selectedClass?.ability_ids || []);
    return abilitiesArray
      .filter((a) => !assignedIds.has(a.id))
      .filter((a) => !abilitySearch || a.name.toLowerCase().includes(abilitySearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [abilitiesArray, selectedClass, abilitySearch]);

  const toggleAbility = (id: number, add: boolean) => {
    if (!selectedClass) return;
    const current = new Set(selectedClass.ability_ids || []);
    if (add) {
      current.add(id);
    } else {
      current.delete(id);
    }
    setClasses((prev) =>
      prev.map((cls) => (cls.id === selectedClass.id ? { ...cls, ability_ids: Array.from(current) } : cls))
    );
  };

  const saveChanges = async () => {
    if (!selectedClass) return;
    setSaving(true);
    setStatus(null);
    const result = await updateClassAbilities(selectedClass.id, selectedClass.ability_ids || []);
    setSaving(false);
    setStatus(result.success ? 'Saved class abilities.' : result.error || 'Failed to save');
  };

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

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center flex-1 text-slate-500 gap-3 p-6">
            <Loader2 className="animate-spin" /> Loading classes and abilities...
          </div>
        ) : !isAdmin ? (
          <div className="flex items-center justify-center flex-1 text-slate-400 p-6 text-sm">
            Admin access required to modify class abilities.
          </div>
        ) : (
          <>
            {status && (
              <div className="px-4 py-2 text-xs border-b border-slate-800 bg-slate-900/60 text-slate-300">{status}</div>
            )}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Class List */}
              <div className="w-56 border-r border-slate-700 bg-slate-900/50 overflow-y-auto">
                <div className="p-2 text-xs text-slate-500 uppercase tracking-wide border-b border-slate-800">
                  Select Class
                </div>
                {classes.map((cls) => (
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
                    <div className="text-[10px] text-slate-500 capitalize">Tier {cls.tier} • Lvl {cls.unlock_level}+</div>
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
                      <div className="mt-2 text-xs text-slate-500">{classAbilities.length} abilities assigned</div>
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
                            <div className="text-center text-slate-600 py-8 text-sm">No abilities assigned to this class.</div>
                          ) : (
                            classAbilities.map((ability) => (
                              <div
                                key={ability.id}
                                className="flex items-center justify-between p-2 bg-green-900/20 rounded border border-green-700/30"
                              >
                                <div>
                                  <div className="font-medium text-slate-200">{ability.name}</div>
                                  <div className="text-[10px] text-slate-500">ID: {ability.id} • Max Level: {ability.maxLevel}</div>
                                </div>
                                <button
                                  onClick={() => toggleAbility(ability.id, false)}
                                  className="text-red-300 hover:text-red-200"
                                  title="Remove from class"
                                >
                                  <Minus size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Other Abilities */}
                      <div className="flex-1 flex flex-col">
                        <div className="p-2 bg-slate-900 border-b border-slate-800">
                          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Other Abilities</div>
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
                            availableAbilities.map((ability) => (
                              <div key={ability.id} className="p-2 bg-slate-800/50 rounded border border-slate-700 text-left flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-slate-200">{ability.name}</div>
                                  <div className="text-[10px] text-slate-600">ID: {ability.id} • Max Level: {ability.maxLevel}</div>
                                </div>
                                <button
                                  onClick={() => toggleAbility(ability.id, true)}
                                  className="text-nexus-accent hover:text-white"
                                  title="Add to class"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-1 text-slate-600">Select a class from the left</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-900/50">
              <div className="text-xs text-slate-500">Changes save directly to MySQL.</div>
              <div className="flex gap-2">
                <button
                  onClick={saveChanges}
                  disabled={saving || !selectedClass}
                  className="px-4 py-2 bg-nexus-accent/80 hover:bg-nexus-accent text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />} Save
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
