import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, X, Briefcase, Info, Save, Trash2 } from 'lucide-react';
import { getCachedProfessions, updateProfession, deleteProfession, LitrpgProfession } from '../utils/api-litrpg';
import { getTierColorByNumber, getTierNumber } from '../tier-constants';

interface ProfessionEditorModalProps {
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

export const ProfessionEditorModal: React.FC<ProfessionEditorModalProps> = ({ isOpen, onClose }) => {
  const [professions, setProfessions] = useState<LitrpgProfession[]>([]);
  const [selectedProfessionId, setSelectedProfessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    tier: 1,
    unlock_level: 1,
    prerequisite_profession_id: null as number | null,
    primary_attribute: '',
    secondary_attribute: '',
    stat_bonuses: {} as Record<string, number>,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const dbProfessions = await getCachedProfessions();
      setProfessions(dbProfessions);
      if (!selectedProfessionId && dbProfessions.length > 0) {
        setSelectedProfessionId(dbProfessions[0].id);
      }
      setLoading(false);
    };

    if (isOpen) {
      load();
    }
  }, [isOpen, selectedProfessionId]);

  const selectedProfession = useMemo(() =>
    professions.find(p => p.id === selectedProfessionId),
    [professions, selectedProfessionId]
  );

  // Populate form when profession is selected
  useEffect(() => {
    if (selectedProfession) {
      // Parse tier: handle both numeric (1, 2, 3) and string ("tier-1", "tier-2") formats
      let tierValue = 1;
      if (typeof selectedProfession.tier === 'number') {
        tierValue = selectedProfession.tier;
      } else if (typeof selectedProfession.tier === 'string') {
        tierValue = getTierNumber(selectedProfession.tier);
      }

      setEditForm({
        name: selectedProfession.name,
        description: selectedProfession.description || '',
        tier: tierValue,
        unlock_level: selectedProfession.unlock_level,
        prerequisite_profession_id: selectedProfession.prerequisite_profession_id || null,
        primary_attribute: selectedProfession.primary_attribute || '',
        secondary_attribute: selectedProfession.secondary_attribute || '',
        stat_bonuses: selectedProfession.stat_bonuses || {},
      });
      setStatus(null);
    }
  }, [selectedProfession]);

  const handleSave = async () => {
    if (!selectedProfessionId) return;

    setSaving(true);
    setStatus(null);

    const result = await updateProfession(selectedProfessionId, {
      name: editForm.name,
      description: editForm.description,
      tier: editForm.tier,
      unlock_level: editForm.unlock_level,
      prerequisite_class_id: editForm.prerequisite_profession_id || undefined,
      primary_attribute: editForm.primary_attribute || undefined,
      secondary_attribute: editForm.secondary_attribute || undefined,
      stat_bonuses: editForm.stat_bonuses,
    });

    if (result.success) {
      setStatus('Profession updated successfully!');
      const dbProfessions = await getCachedProfessions();
      setProfessions(dbProfessions);
    } else {
      setStatus(`Error: ${result.error}`);
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedProfessionId || !confirmDelete) {
      setConfirmDelete(true);
      setStatus('Click DELETE again to confirm');
      return;
    }

    setDeleting(true);
    setStatus(null);

    const result = await deleteProfession(selectedProfessionId);

    if (result.success) {
      setStatus('Profession deleted successfully!');
      const dbProfessions = await getCachedProfessions();
      setProfessions(dbProfessions);

      const newSelectedId = dbProfessions.length > 0 ? dbProfessions[0].id : null;
      setSelectedProfessionId(newSelectedId);
      setConfirmDelete(false);
    } else {
      setStatus(`Error: ${result.error}`);
    }

    setDeleting(false);
  };

  const updateStatBonus = (attr: AttributeKey, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditForm(prev => ({
      ...prev,
      stat_bonuses: {
        ...prev.stat_bonuses,
        [attr]: numValue
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-nexus-panel border border-slate-600 shadow-2xl rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3">
            <Briefcase className="text-blue-400" size={24} />
            <div>
              <h2 className="text-lg font-bold text-white">Profession Editor</h2>
              <p className="text-xs text-slate-400">Edit profession properties and stat bonuses</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2 text-sm bg-blue-900/20 text-blue-400 border-b border-blue-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={16} />
            <span>Select a profession to edit. Changes are saved to MySQL.</span>
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
              <Loader2 className="animate-spin" size={18} /> Loading professions...
            </div>
          ) : (
            <>
              {/* Left: Profession List */}
              <div className="w-64 border-r border-slate-700 bg-slate-900/50 flex flex-col">
                <div className="p-2 border-b border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Professions ({professions.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {professions.map(prof => (
                    <button
                      key={prof.id}
                      onClick={() => setSelectedProfessionId(prof.id)}
                      className={`w-full text-left px-3 py-2 border-b border-slate-800 transition-colors ${
                        selectedProfessionId === prof.id
                          ? 'bg-blue-500/10 border-l-2 border-l-blue-500 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="font-medium">{prof.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span className={`px-1 rounded ${getTierColorByNumber(getTierNumber(prof.tier))}`}>
                          Tier {getTierNumber(prof.tier)}
                        </span>
                        <span>Lvl {prof.unlock_level}+</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Profession Details */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedProfession ? (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 uppercase mb-1">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 uppercase mb-1">Tier</label>
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={editForm.tier}
                          onChange={(e) => setEditForm({ ...editForm, tier: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 uppercase mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white min-h-[80px] focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 uppercase mb-1">Unlock Level</label>
                        <input
                          type="number"
                          min={1}
                          value={editForm.unlock_level}
                          onChange={(e) => setEditForm({ ...editForm, unlock_level: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 uppercase mb-1">Prerequisite Profession</label>
                        <select
                          value={editForm.prerequisite_profession_id || ''}
                          onChange={(e) => setEditForm({ ...editForm, prerequisite_profession_id: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                        >
                          <option value="">None</option>
                          {professions.map(prof => (
                            <option key={prof.id} value={prof.id}>
                              {prof.name} (Tier {getTierNumber(prof.tier)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Primary & Secondary Attributes */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-bold text-blue-400 mb-3">Profession Attributes</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 uppercase mb-1">Primary Attribute</label>
                          <select
                            value={editForm.primary_attribute}
                            onChange={(e) => setEditForm({ ...editForm, primary_attribute: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                          >
                            <option value="">Not Set</option>
                            {ATTRIBUTES.map(attr => (
                              <option key={attr} value={attr}>{attr} - {ATTRIBUTE_NAMES[attr]}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 uppercase mb-1">Secondary Attribute</label>
                          <select
                            value={editForm.secondary_attribute}
                            onChange={(e) => setEditForm({ ...editForm, secondary_attribute: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:border-blue-500 outline-none"
                          >
                            <option value="">Not Set</option>
                            {ATTRIBUTES.map(attr => (
                              <option key={attr} value={attr}>{attr} - {ATTRIBUTE_NAMES[attr]}</option>
                            ))}
                          </select>
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
                            <input
                              type="number"
                              value={editForm.stat_bonuses[attr] || 0}
                              onChange={(e) => updateStatBonus(attr, e.target.value)}
                              className="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-center text-xs font-mono focus:border-green-500 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ability Info (Read-Only) */}
                    {selectedProfession.ability_ids && selectedProfession.ability_ids.length > 0 && (
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-sm font-bold text-purple-400 mb-3">Assigned Ability IDs</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfession.ability_ids.map(id => (
                            <span key={id} className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs font-mono">
                              #{id}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Use "Manage Abilities" button to edit abilities</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600">
                    Select a profession from the left
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={handleDelete}
            disabled={deleting || !selectedProfessionId}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              confirmDelete
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white'
            } disabled:bg-slate-800 disabled:text-slate-600`}
            onMouseLeave={() => setConfirmDelete(false)}
          >
            {deleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {confirmDelete ? 'Confirm Delete?' : 'Delete'}
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedProfessionId}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
