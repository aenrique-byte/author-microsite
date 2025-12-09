import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, X, Zap, Info, Save, Minus, Swords, Briefcase } from 'lucide-react';
import {
  getCachedClasses,
  getCachedProfessions,
  updateClass,
  updateProfession,
  LitrpgClass,
  LitrpgProfession,
  getCachedAbilities,
  LitrpgAbility
} from '../utils/api-litrpg';
import { getTierColorByNumber, getTierNumber } from '../tier-constants';

interface AbilityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type EntityType = 'class' | 'profession';

export const AbilityManagerModal: React.FC<AbilityManagerModalProps> = ({ isOpen, onClose }) => {
  const [entityType, setEntityType] = useState<EntityType>('class');
  const [classes, setClasses] = useState<LitrpgClass[]>([]);
  const [professions, setProfessions] = useState<LitrpgProfession[]>([]);
  const [abilities, setAbilities] = useState<LitrpgAbility[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [abilityIds, setAbilityIds] = useState<number[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [dbClasses, dbProfessions, dbAbilities] = await Promise.all([
        getCachedClasses(),
        getCachedProfessions(),
        getCachedAbilities()
      ]);
      setClasses(dbClasses);
      setProfessions(dbProfessions);
      setAbilities(dbAbilities);

      // Select first item of current entity type
      if (!selectedId) {
        if (entityType === 'class' && dbClasses.length > 0) {
          setSelectedId(dbClasses[0].id);
        } else if (entityType === 'profession' && dbProfessions.length > 0) {
          setSelectedId(dbProfessions[0].id);
        }
      }
      setLoading(false);
    };

    if (isOpen) {
      load();
    }
  }, [isOpen, entityType, selectedId]);

  const currentList = entityType === 'class' ? classes : professions;
  const selectedEntity = useMemo(() =>
    currentList.find(e => e.id === selectedId),
    [currentList, selectedId]
  );

  // Alphabetically sorted abilities
  const sortedAbilities = useMemo(() =>
    [...abilities].sort((a, b) => a.name.localeCompare(b.name)),
    [abilities]
  );

  // Populate ability IDs when entity is selected
  useEffect(() => {
    if (selectedEntity) {
      setAbilityIds(selectedEntity.ability_ids || []);
      setStatus(null);
    }
  }, [selectedEntity]);

  const handleSave = async () => {
    if (!selectedId) return;

    setSaving(true);
    setStatus(null);

    // Only save ability_ids, nothing else
    const payload = {
      ability_ids: abilityIds,
    };

    const result = entityType === 'class'
      ? await updateClass(selectedId, payload)
      : await updateProfession(selectedId, payload);

    if (result.success) {
      setStatus(`${entityType === 'class' ? 'Class' : 'Profession'} abilities updated successfully!`);
      // Reload data
      const [dbClasses, dbProfessions] = await Promise.all([
        getCachedClasses(),
        getCachedProfessions()
      ]);
      setClasses(dbClasses);
      setProfessions(dbProfessions);
    } else {
      setStatus(`Error: ${result.error}`);
    }

    setSaving(false);
  };

  const addAbility = (abilityId: number) => {
    if (!abilityIds.includes(abilityId)) {
      setAbilityIds(prev => [...prev, abilityId]);
    }
  };

  const removeAbility = (abilityId: number) => {
    setAbilityIds(prev => prev.filter(id => id !== abilityId));
  };

  // Switch entity type and reset selection
  const switchEntityType = (newType: EntityType) => {
    setEntityType(newType);
    const newList = newType === 'class' ? classes : professions;
    setSelectedId(newList.length > 0 ? newList[0].id : null);
  };

  if (!isOpen) return null;

  const iconColor = entityType === 'class' ? 'text-orange-400' : 'text-blue-400';
  const accentColor = entityType === 'class' ? 'orange' : 'blue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-nexus-panel border border-slate-600 shadow-2xl rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3">
            {entityType === 'class' ? (
              <Swords className={iconColor} size={24} />
            ) : (
              <Briefcase className={iconColor} size={24} />
            )}
            <div>
              <h2 className="text-lg font-bold text-white">Ability Manager</h2>
              <p className="text-xs text-slate-400">Manage abilities for classes and professions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Entity Type Toggle */}
        <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
          <button
            onClick={() => switchEntityType('class')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors flex-1 justify-center ${
              entityType === 'class'
                ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            <Swords size={14} />
            Combat Classes
          </button>
          <button
            onClick={() => switchEntityType('profession')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors flex-1 justify-center ${
              entityType === 'profession'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            <Briefcase size={14} />
            Professions
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2 text-sm bg-blue-900/20 text-blue-400 border-b border-blue-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} />
            <span>Select a {entityType} to manage abilities. Changes are saved to MySQL.</span>
          </div>
          {status && (
            <span className={`text-xs ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {status}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="animate-spin" size={18} /> Loading...
            </div>
          ) : (
            <>
              {/* Left: Entity List */}
              <div className="w-64 border-r border-slate-700 bg-slate-900/50 flex flex-col">
                <div className="p-2 border-b border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    {entityType === 'class' ? 'Classes' : 'Professions'} ({currentList.length})
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {currentList.map(entity => (
                    <button
                      key={entity.id}
                      onClick={() => setSelectedId(entity.id)}
                      className={`w-full text-left px-3 py-2 border-b border-slate-800 transition-colors ${
                        selectedId === entity.id
                          ? `bg-${accentColor}-500/10 border-l-2 border-l-${accentColor}-500 text-white`
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="font-medium">{entity.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span className={`px-1 rounded ${getTierColorByNumber(getTierNumber(entity.tier))}`}>
                          Tier {getTierNumber(entity.tier)}
                        </span>
                        <span>Lvl {entity.unlock_level}+</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Ability Management Only */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedEntity ? (
                  <div className="space-y-6">
                    {/* Entity Info Header (Read-Only) */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <h2 className="text-xl font-bold text-white mb-2">{selectedEntity.name}</h2>
                      <p className="text-sm text-slate-400 mb-3">{selectedEntity.description || 'No description'}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className={`px-2 py-1 rounded ${getTierColorByNumber(getTierNumber(selectedEntity.tier))}`}>
                          Tier {getTierNumber(selectedEntity.tier)}
                        </span>
                        <span>Unlock Level: {selectedEntity.unlock_level}</span>
                        {selectedEntity.primary_attribute && (
                          <span>Primary: {selectedEntity.primary_attribute}</span>
                        )}
                      </div>
                    </div>

                    {/* Ability Management */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                        <Zap size={16} />
                        Manage Abilities
                      </h3>

                      {/* Assigned Abilities */}
                      <div className="mb-4">
                        <label className="block text-xs text-slate-500 uppercase mb-2">
                          Assigned Abilities ({abilityIds.length})
                        </label>
                        {abilityIds.length > 0 ? (
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {abilityIds.map(id => {
                              const ability = abilities.find(a => a.id === id);
                              return (
                                <div key={id} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded border border-slate-700">
                                  <div className="flex-1">
                                    <span className="text-sm text-white">{ability?.name || `Ability #${id}`}</span>
                                    {ability && (
                                      <span className="text-xs text-slate-500 ml-2">({ability.maxLevel} levels)</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeAbility(id)}
                                    className="ml-2 p-1 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300 transition-colors"
                                    title="Remove ability"
                                  >
                                    <Minus size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic py-2">No abilities assigned</div>
                        )}
                      </div>

                      {/* Available Abilities (Alphabetically Sorted) */}
                      <div>
                        <label className="block text-xs text-slate-500 uppercase mb-2">Add Ability</label>
                        <select
                          onChange={(e) => {
                            const id = parseInt(e.target.value);
                            if (id) {
                              addAbility(id);
                              e.target.value = ''; // Reset select
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-purple-500 outline-none text-sm"
                          value=""
                        >
                          <option value="">Select an ability to add...</option>
                          {sortedAbilities
                            .filter(a => !abilityIds.includes(a.id))
                            .map(ability => (
                              <option key={ability.id} value={ability.id}>
                                {ability.name} (Max Lvl {ability.maxLevel})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600">
                    Select a {entityType} from the left
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedId}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Abilities
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
