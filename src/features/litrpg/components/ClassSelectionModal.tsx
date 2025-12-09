import React, { useState, useEffect } from 'react';
import { X, Loader2, Star, Swords, Check, ArrowRight, Shield, Brain, Zap, Eye, MessageSquare, Briefcase } from 'lucide-react';
import { getCachedClasses, getCachedProfessions, LitrpgClass, LitrpgProfession } from '../utils/api-litrpg';
import { TIER_ORDER, TIER_TEXT_COLORS, ClassTier, getTierString } from '../tier-constants';

interface ClassSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClass: (classId: number, className: string) => void;
  currentClassId?: number | null;
  characterLevel: number;
  defaultCategory?: 'combat' | 'professional'; // Default category
  lockCategory?: boolean; // If true, hide category toggle and lock to defaultCategory
}

const TIER_CARD_COLORS: Record<string, string> = {
  base: 'border-slate-600 bg-slate-800/50',
  advanced: 'border-blue-700 bg-blue-900/20',
  elite: 'border-purple-700 bg-purple-900/20',
  legendary: 'border-yellow-600 bg-yellow-900/20',
  mythic: 'border-orange-600 bg-orange-900/20',
  transcendent: 'border-red-600 bg-red-900/20',
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  STR: <Swords size={12} className="text-red-500" />,
  PER: <Eye size={12} className="text-green-500" />,
  DEX: <Zap size={12} className="text-yellow-500" />,
  MEM: <Brain size={12} className="text-purple-500" />,
  INT: <Shield size={12} className="text-blue-500" />,
  CHA: <MessageSquare size={12} className="text-pink-500" />,
};

export const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectClass,
  currentClassId,
  characterLevel,
  defaultCategory = 'combat',
  lockCategory = false,
}) => {
  const [classes, setClasses] = useState<LitrpgClass[]>([]);
  const [professions, setProfessions] = useState<LitrpgProfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(currentClassId || null);
  const [category, setCategory] = useState<'combat' | 'professional'>(defaultCategory);

  useEffect(() => {
    if (isOpen) {
      loadClasses();
      setSelectedClassId(currentClassId || null);
      setCategory(defaultCategory); // Reset to default when opening
    }
  }, [isOpen, currentClassId, defaultCategory]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const [dbClasses, dbProfessions] = await Promise.all([
        getCachedClasses(),
        getCachedProfessions()
      ]);
      setClasses(dbClasses);
      setProfessions(dbProfessions);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
    setLoading(false);
  };

  // Combine classes and professions based on category
    const displayItems = category === 'combat'
      ? classes
      : professions.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          tier: p.tier,
          unlock_level: p.unlock_level,
          prerequisite_class_id: p.prerequisite_profession_id,
          stat_bonuses: p.stat_bonuses,
          primary_attribute: undefined,
          secondary_attribute: undefined,
          starting_item: undefined,
          ability_ids: p.ability_ids,
          upgrade_ids: [],
          created_at: '',
          updated_at: ''
        } as LitrpgClass));

  // Group items by tier
  const groupedClasses = displayItems.reduce((acc, cls) => {
    if (!acc[cls.tier]) acc[cls.tier] = [];
    acc[cls.tier].push(cls);
    return acc;
  }, {} as Record<string, LitrpgClass[]>);

  // Check if character meets requirements for a class
  const canSelectClass = (cls: LitrpgClass): boolean => {
    // Must meet level requirement
    if (characterLevel < cls.unlock_level) return false;
    
    // If has prerequisite, must have that class (for now, always allow if level is met)
    // Future: check if character has prerequisite class
    return true;
  };

  const handleConfirm = () => {
    if (selectedClassId) {
      let cls: LitrpgClass | undefined;

      // Search in the correct array based on category
      if (category === 'professional') {
        // For professions, search professions array ONLY
        const profession = professions.find(p => p.id === selectedClassId);
        if (profession) {
          cls = {
            id: profession.id,
            name: profession.name,
            slug: profession.slug,
            description: profession.description,
            tier: profession.tier,
            unlock_level: profession.unlock_level,
            prerequisite_class_id: profession.prerequisite_profession_id,
            stat_bonuses: profession.stat_bonuses,
            primary_attribute: undefined,
            secondary_attribute: undefined,
            starting_item: undefined,
            ability_ids: profession.ability_ids,
            upgrade_ids: [],
            created_at: '',
            updated_at: ''
          } as LitrpgClass;
        }
      } else {
        // For combat classes, search classes array ONLY
        cls = classes.find(c => c.id === selectedClassId);
      }

      if (cls) {
        onSelectClass(selectedClassId, cls.name);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-nexus-panel border border-slate-600 shadow-2xl rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {category === 'combat' ? (
                <Swords className="text-orange-400" size={24} />
              ) : (
                <Briefcase className="text-blue-400" size={24} />
              )}
              <div>
                <h2 className="text-lg font-bold text-white">
                  Select {category === 'combat' ? 'Class' : 'Profession'}
                </h2>
                <p className="text-xs text-slate-400">
                  Character Level: <span className="text-nexus-accent font-bold">{characterLevel}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {/* Category Toggle - Only show when not locked */}
          {!lockCategory && (
            <div className="flex gap-2">
              <button
                onClick={() => setCategory('combat')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors flex-1 justify-center ${
                  category === 'combat'
                    ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Swords size={14} />
                Combat Classes
              </button>
              <button
                onClick={() => setCategory('professional')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors flex-1 justify-center ${
                  category === 'professional'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <Briefcase size={14} />
                Professions
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-nexus-accent mb-4" />
              <p className="text-slate-500">Loading classes...</p>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              No {category === 'combat' ? 'classes' : 'professions'} found.
            </div>
          ) : (
            <div className="space-y-6">
              {TIER_ORDER.map((tier) => {
                const tierClasses = groupedClasses[tier];
                if (!tierClasses || tierClasses.length === 0) return null;

                return (
                  <div key={tier}>
                    <h3 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-3 ${TIER_TEXT_COLORS[tier as ClassTier] || 'text-slate-400'}`}>
                      <Star size={14} />
                      {tier} {category === 'combat' ? 'Classes' : 'Professions'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tierClasses.map((cls) => {
                        const isSelected = selectedClassId === cls.id;
                        const isAvailable = canSelectClass(cls);
                        const isCurrent = currentClassId === cls.id;

                        return (
                          <button
                            key={cls.id}
                            onClick={() => isAvailable && setSelectedClassId(cls.id)}
                            disabled={!isAvailable}
                            className={`relative text-left p-4 rounded-lg border-2 transition-all ${
                              isSelected 
                                ? 'border-nexus-accent bg-nexus-accent/10 ring-2 ring-nexus-accent/30' 
                                : isAvailable
                                  ? `${TIER_CARD_COLORS[cls.tier] || 'border-slate-600 bg-slate-800/50'} hover:border-slate-500 cursor-pointer`
                                  : 'border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {/* Current Class Badge */}
                            {isCurrent && (
                              <span className="absolute top-2 right-2 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">
                                Current
                              </span>
                            )}

                            {/* Selected Checkmark */}
                            {isSelected && !isCurrent && (
                              <span className="absolute top-2 right-2 w-6 h-6 bg-nexus-accent rounded-full flex items-center justify-center">
                                <Check size={14} className="text-black" />
                              </span>
                            )}

                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-bold ${isAvailable ? 'text-white' : 'text-slate-500'}`}>
                                {cls.name}
                              </h4>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${TIER_TEXT_COLORS[typeof cls.tier === 'number' ? getTierString(cls.tier) : cls.tier as ClassTier] || 'text-slate-400'} bg-slate-800`}>
                                {typeof cls.tier === 'number' ? `Tier ${cls.tier}` : cls.tier}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                              {cls.description || 'No description.'}
                            </p>

                            <div className="flex items-center gap-2 text-xs">
                              <span className={`${characterLevel >= cls.unlock_level ? 'text-green-400' : 'text-red-400'}`}>
                                Lvl {cls.unlock_level}+
                              </span>
                              {cls.prerequisite_class_id && (
                                <span className="text-slate-500 flex items-center gap-1">
                                  <ArrowRight size={10} />
                                  Requires another class
                                </span>
                              )}
                            </div>

                            {/* Stat Bonuses */}
                            {cls.stat_bonuses && Object.keys(cls.stat_bonuses).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(cls.stat_bonuses).map(([stat, bonus]) => (
                                  <span key={stat} className="flex items-center gap-0.5 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">
                                    {STAT_ICONS[stat]}
                                    <span className={bonus > 0 ? 'text-green-400' : 'text-red-400'}>
                                      {bonus > 0 ? '+' : ''}{bonus}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedClassId}
            className="flex items-center gap-2 px-4 py-2 bg-nexus-accent hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};
