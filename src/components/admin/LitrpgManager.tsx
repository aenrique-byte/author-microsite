import { useState, useEffect, ReactNode } from 'react';
import { Loader2, RefreshCw, Pencil, Trash2, Plus, X, Users } from 'lucide-react';
import { 
  listCharacters, createCharacter, updateCharacter, deleteCharacter,
  LitrpgCharacter
} from '../../features/litrpg/utils/api-litrpg';
import { DB_CLASSES } from '../../features/litrpg/class-constants';

// FormField defined outside component to prevent focus loss on re-render
const FormField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    {children}
  </div>
);

export default function LitrpgManager() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [characters, setCharacters] = useState<LitrpgCharacter[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  // Get classes from constants
  const classesArray = Object.values(DB_CLASSES);

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadCharacters = async () => {
    setLoading(true);
    setError(null);
    const result = await listCharacters();
    if (result.success) {
      setCharacters(result.characters);
    } else {
      setError(result.error || 'Failed to load characters');
    }
    setLoading(false);
  };

  const handleSave = async (data: any) => {
    setSaving(true);
    setError(null);
    
    try {
      const result = isCreating ? await createCharacter(data) : await updateCharacter(data);
      
      if (result?.success) {
        setSuccess(isCreating ? 'Created successfully!' : 'Updated successfully!');
        setEditingItem(null);
        setIsCreating(false);
        loadCharacters();
      } else {
        setError(result?.error || 'Operation failed');
      }
    } catch (err) {
      setError('Save failed: ' + String(err));
    }
    
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    setError(null);
    
    try {
      const result = await deleteCharacter(id);
      if (result?.success) {
        setSuccess('Deleted successfully!');
        setDeleteConfirm(null);
        loadCharacters();
      } else {
        setError(result?.error || 'Delete failed');
      }
    } catch (err) {
      setError('Delete failed: ' + String(err));
    }
    
    setSaving(false);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setIsCreating(false);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditingItem({ 
      name: '', 
      level: 1, 
      xp_current: 0, 
      credits: 0, 
      status: 'active',
      stats: { STR: 3, PER: 3, DEX: 3, MEM: 3, INT: 3, CHA: 3 }
    });
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm";
  const STAT_KEYS = ['STR', 'PER', 'DEX', 'MEM', 'INT', 'CHA'] as const;

  const updateCharacterStat = (stat: string, value: number) => {
    const currentStats = editingItem.stats || {};
    const newStats = { ...currentStats, [stat]: value };
    setEditingItem({ ...editingItem, stats: newStats });
  };

  const renderCharacterForm = () => (
    <>
      <FormField label="Name *">
        <input type="text" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className={inputClass} />
      </FormField>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Level">
          <input type="number" value={editingItem.level || 1} onChange={e => setEditingItem({...editingItem, level: parseInt(e.target.value) || 1})} className={inputClass} />
        </FormField>
        <FormField label="XP">
          <input type="number" value={editingItem.xp_current || 0} onChange={e => setEditingItem({...editingItem, xp_current: parseInt(e.target.value) || 0})} className={inputClass} />
        </FormField>
      </div>
      
      <FormField label="Class">
        <select 
          value={editingItem.class_id || ''} 
          onChange={e => setEditingItem({...editingItem, class_id: e.target.value ? parseInt(e.target.value) : null})} 
          className={inputClass}
        >
          <option value="">None (Recruit)</option>
          {classesArray.map(c => (
            <option key={c.id} value={c.id}>{c.name} (Tier {c.tier})</option>
          ))}
        </select>
      </FormField>
      
      <FormField label="Credits">
        <input type="number" value={editingItem.credits || 0} onChange={e => setEditingItem({...editingItem, credits: parseInt(e.target.value) || 0})} className={inputClass} />
      </FormField>
      
      <FormField label="Status">
        <select value={editingItem.status || 'active'} onChange={e => setEditingItem({...editingItem, status: e.target.value})} className={inputClass}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FormField>

      {/* Stats Section */}
      <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Character Stats</h4>
        <div className="grid grid-cols-3 gap-3">
          {STAT_KEYS.map(stat => (
            <div key={stat} className="flex items-center gap-2">
              <label className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">{stat}:</label>
              <input 
                type="number" 
                value={editingItem.stats?.[stat] || 3} 
                onChange={e => updateCharacterStat(stat, parseInt(e.target.value) || 3)}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                min={1}
                max={99}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderEditModal = () => {
    if (!editingItem) return null;
    
    const title = isCreating ? 'Create Character' : 'Edit Character';
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">{error}</div>}
            {renderCharacterForm()}
          </div>
          
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Cancel
            </button>
            <button onClick={() => handleSave(editingItem)} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {isCreating ? 'Create' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirm = () => {
    if (!deleteConfirm) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Confirm Delete</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              Cancel
            </button>
            <button onClick={() => handleDelete(deleteConfirm.id)} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="text-cyan-400" />
            LitRPG Character Manager
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={openCreate} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
              <Plus size={14} />
              Add Character
            </button>
            <button onClick={loadCharacters} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-sm">
            {success}
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Manage player and NPC characters. Other game data (classes, abilities, monsters, items) is managed via constants files.
        </p>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-400 mr-3" />
              <span className="text-gray-500 dark:text-gray-400">Loading characters...</span>
            </div>
          ) : error && !editingItem ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={loadCharacters} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Level</th>
                    <th className="px-4 py-3 text-left">Class</th>
                    <th className="px-4 py-3 text-left">Credits</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {characters.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No characters found</td></tr>
                  ) : characters.map(char => (
                    <tr key={char.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{char.name}</td>
                      <td className="px-4 py-3">{char.level}</td>
                      <td className="px-4 py-3">{char.class_name || 'Recruit'}</td>
                      <td className="px-4 py-3">{char.credits.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${char.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {char.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEdit(char)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm({ id: char.id, name: char.name })} className="text-red-500 hover:text-red-700 p-1" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {renderEditModal()}
      {renderDeleteConfirm()}
    </div>
  );
}
