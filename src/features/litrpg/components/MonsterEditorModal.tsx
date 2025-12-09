import React, { useEffect, useState } from 'react';
import { Loader2, X, Skull, Info, Save, Trash2 } from 'lucide-react';
import { getCachedMonsters, updateMonster, deleteMonster, LitrpgMonster } from '../utils/api-litrpg';

interface MonsterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MonsterRank = 'Trash' | 'Regular' | 'Champion' | 'Boss';

export const MonsterEditorModal: React.FC<MonsterEditorModalProps> = ({ isOpen, onClose }) => {
  const [monsters, setMonsters] = useState<LitrpgMonster[]>([]);
  const [selectedMonsterId, setSelectedMonsterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    level: 1,
    rank: 'Regular' as MonsterRank,
    xp_reward: 10,
    credits: 5,
    hp: 100,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const dbMonsters = await getCachedMonsters();
      setMonsters(dbMonsters);
      if (!selectedMonsterId && dbMonsters.length > 0) {
        setSelectedMonsterId(dbMonsters[0].id);
      }
      setLoading(false);
    };

    if (isOpen) {
      load();
    }
  }, [isOpen, selectedMonsterId]);

  const selectedMonster = monsters.find(m => m.id === selectedMonsterId);

  // Populate form when monster is selected
  useEffect(() => {
    if (selectedMonster) {
      setEditForm({
        name: selectedMonster.name,
        description: selectedMonster.description || '',
        level: selectedMonster.level,
        rank: selectedMonster.rank as MonsterRank,
        xp_reward: selectedMonster.xp_reward,
        credits: selectedMonster.credits,
        hp: selectedMonster.hp || 100,
      });
      setStatus(null);
    }
  }, [selectedMonster]);

  const handleSave = async () => {
    if (!selectedMonsterId) return;

    setSaving(true);
    setStatus(null);

    const result = await updateMonster(selectedMonsterId, {
      name: editForm.name,
      description: editForm.description,
      level: editForm.level,
      rank: editForm.rank,
      xp_reward: editForm.xp_reward,
      credits: editForm.credits,
      hp: editForm.hp,
    });

    if (result.success) {
      setStatus('Monster updated successfully!');
      // Reload monsters to reflect changes
      const dbMonsters = await getCachedMonsters();
      setMonsters(dbMonsters);
    } else {
      setStatus(`Error: ${result.error}`);
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedMonsterId || !confirmDelete) {
      setConfirmDelete(true);
      setStatus('Click DELETE again to confirm');
      return;
    }

    setDeleting(true);
    setStatus(null);

    const result = await deleteMonster(selectedMonsterId);

    if (result.success) {
      setStatus('Monster deleted successfully!');
      const dbMonsters = await getCachedMonsters();
      setMonsters(dbMonsters);

      // Select first monster or null if no monsters left
      const newSelectedId = dbMonsters.length > 0 ? dbMonsters[0].id : null;
      setSelectedMonsterId(newSelectedId);
      setConfirmDelete(false);
    } else {
      setStatus(`Error: ${result.error}`);
    }

    setDeleting(false);
  };

  if (!isOpen) return null;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Trash': return 'bg-gray-600/20 text-gray-400 border-gray-600';
      case 'Regular': return 'bg-green-600/20 text-green-400 border-green-600';
      case 'Champion': return 'bg-purple-600/20 text-purple-400 border-purple-600';
      case 'Boss': return 'bg-red-600/20 text-red-400 border-red-600';
      default: return 'bg-slate-600/20 text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-nexus-panel border border-slate-600 shadow-2xl rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3">
            <Skull className="text-red-400" size={24} />
            <div>
              <h2 className="text-lg font-bold text-white">Monster Editor</h2>
              <p className="text-xs text-slate-400">Edit monster properties and stats</p>
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
            <span>Select a monster to edit. Changes are saved to MySQL.</span>
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
              <Loader2 className="animate-spin" size={18} /> Loading monsters...
            </div>
          ) : (
            <>
              {/* Left: Monster List */}
              <div className="w-64 border-r border-slate-700 bg-slate-900/50 flex flex-col">
                <div className="p-2 border-b border-slate-800">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Monsters ({monsters.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {monsters.map(monster => (
                    <button
                      key={monster.id}
                      onClick={() => setSelectedMonsterId(monster.id)}
                      className={`w-full text-left px-3 py-2 border-b border-slate-800 transition-colors ${
                        selectedMonsterId === monster.id
                          ? 'bg-red-500/10 border-l-2 border-l-red-500 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="font-medium">{monster.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span className={`px-1 rounded text-[9px] border ${getRankColor(monster.rank)}`}>
                          {monster.rank}
                        </span>
                        <span>Lvl {monster.level}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Monster Details */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedMonster ? (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-red-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">Rank</label>
                        <select
                          value={editForm.rank}
                          onChange={(e) => setEditForm({ ...editForm, rank: e.target.value as MonsterRank })}
                          className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-red-500 outline-none"
                        >
                          {(['Trash', 'Regular', 'Champion', 'Boss'] as const).map((rank) => (
                            <option key={rank} value={rank}>{rank}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white min-h-[80px] focus:border-red-500 outline-none"
                      />
                    </div>

                    {/* Stats */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-bold text-red-400 mb-3">Stats</h3>
                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">Level</label>
                          <input
                            type="number"
                            min={1}
                            value={editForm.level}
                            onChange={(e) => setEditForm({ ...editForm, level: parseInt(e.target.value) || 1 })}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">HP</label>
                          <input
                            type="number"
                            min={1}
                            value={editForm.hp}
                            onChange={(e) => setEditForm({ ...editForm, hp: parseInt(e.target.value) || 100 })}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">XP Reward</label>
                          <input
                            type="number"
                            min={0}
                            value={editForm.xp_reward}
                            onChange={(e) => setEditForm({ ...editForm, xp_reward: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 uppercase mb-1 font-semibold">Credits</label>
                          <input
                            type="number"
                            min={0}
                            value={editForm.credits}
                            onChange={(e) => setEditForm({ ...editForm, credits: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-red-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600">
                    Select a monster from the left
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
            disabled={deleting || !selectedMonsterId}
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
              disabled={saving || !selectedMonsterId}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
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
