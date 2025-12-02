
import React from 'react';
import { Shield, Brain, Zap, Eye, Swords, MessageSquare, X, Flame, AlertTriangle, Globe, Clock, Timer } from 'lucide-react';
import { Attribute } from '../types';
import { ATTRIBUTE_DESCRIPTIONS, MEM_CDR_DIMINISHING_FACTOR, INT_DURATION_SCALING_FACTOR } from '../constants';

interface AttributeEncyclopediaProps {
  onClose: () => void;
}

export const AttributeEncyclopedia: React.FC<AttributeEncyclopediaProps> = ({ onClose }) => {
  
  const attrIcons: Record<Attribute, React.ReactNode> = {
    [Attribute.STR]: <Swords className="text-red-500" size={24} />,
    [Attribute.PER]: <Eye className="text-emerald-500" size={24} />,
    [Attribute.DEX]: <Zap className="text-yellow-500" size={24} />,
    [Attribute.MEM]: <Brain className="text-purple-500" size={24} />,
    [Attribute.INT]: <Shield className="text-blue-500" size={24} />,
    [Attribute.CHA]: <MessageSquare className="text-pink-500" size={24} />
  };

  const extendedDescriptions: Record<Attribute, string> = {
    [Attribute.STR]: "Determines physical power, melee damage output, and carrying capacity. It directly contributes to your total Health Points (HP).",
    [Attribute.PER]: "Governs situational awareness, detection of stealth/traps, accuracy with ranged weapons, and initiative in combat.",
    [Attribute.DEX]: "Controls agility, evasion, piloting skills, stealth effectiveness, and fine motor precision.",
    [Attribute.MEM]: "Critical for skill proficiency, recall, and resisting mental attacks. Higher MEM reduces Ability Cooldowns.",
    [Attribute.INT]: "The stat for problem-solving, hacking, and engineering. Determines Energy Points (EP) and increases Ability Duration.",
    [Attribute.CHA]: "Represents enhanced perception and pattern recognition applied to communication. Governs social awareness, leadership presence, linguistic adaptability, and cross-species interpretation.",
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
              <Shield className="text-nexus-accent" size={24} />
              <h1 className="text-xl font-bold text-white font-mono tracking-wider">ATTRIBUTE ENCYCLOPEDIA</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
          >
              <X size={24} />
          </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-6xl mx-auto space-y-12">

             {/* SECTION 1: CORE ATTRIBUTES */}
             <section>
                <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-3 border-b border-slate-800 pb-2">
                    <Shield size={24} className="text-nexus-accent" /> 
                    Core Attributes
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(Object.keys(ATTRIBUTE_DESCRIPTIONS) as Attribute[]).map(attr => (
                        <div key={attr} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-600 transition-colors flex flex-col h-full shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                {attrIcons[attr]}
                                <h3 className="text-2xl font-bold text-slate-200">{attr}</h3>
                            </div>
                            <p className="text-sm text-slate-300 mb-3 font-semibold">
                                {ATTRIBUTE_DESCRIPTIONS[attr]}
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {extendedDescriptions[attr]}
                            </p>
                        </div>
                    ))}
                </div>
             </section>

             {/* SECTION 2: MECHANICS */}
             <section>
                <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-3 border-b border-slate-800 pb-2">
                    <Brain size={24} className="text-purple-400" /> 
                    Game Mechanics
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Neural Heat */}
                    <div className="bg-orange-950/10 border border-orange-500/20 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Flame size={150} />
                        </div>
                        <h3 className="text-orange-400 font-bold text-lg flex items-center gap-2 mb-4">
                            <AlertTriangle size={20} />
                            Neural Heat Rules
                        </h3>
                        <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-md">
                            Abilities have a <span className="text-nexus-accent">Safe Limit</span> duration. Pushing past this limit generates Neural Heat, causing progressive physiological failure.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                            <div className="bg-black/40 p-3 rounded border border-orange-900/30">
                                <span className="text-orange-300 font-bold text-sm block mb-1">10 Heat</span>
                                <span className="text-slate-400 text-xs">Pressure behind eyes</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded border border-orange-900/30">
                                <span className="text-orange-400 font-bold text-sm block mb-1">20 Heat</span>
                                <span className="text-slate-400 text-xs">Blurring vision, ringing</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded border border-red-900/30">
                                <span className="text-red-400 font-bold text-sm block mb-1">50 Heat</span>
                                <span className="text-slate-400 text-xs">Nosebleed, forced shutdown</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded border border-red-900/30">
                                <span className="text-red-500 font-black text-sm block mb-1">100 Heat</span>
                                <span className="text-slate-400 text-xs">Lockout (1-4 hours)</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded border border-red-900/30">
                                <span className="text-red-600 font-black text-sm block mb-1">150 Heat</span>
                                <span className="text-slate-400 text-xs">Migraines, blackouts</span>
                            </div>
                            <div className="bg-black/40 p-3 rounded border border-red-900/30">
                                <span className="text-red-700 font-black text-sm block mb-1">200 Heat</span>
                                <span className="text-slate-400 text-xs">Near-coma / Critical Failure</span>
                            </div>
                        </div>
                    </div>

                    {/* Memory Mechanics */}
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                        <h3 className="text-purple-400 font-bold text-lg flex items-center gap-2 mb-4">
                            <Clock size={20} />
                            Memory (MEM) Scaling
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Memory reduces Ability Cooldowns using a diminishing returns formula, ensuring you never reach 0 second cooldowns but making every point valuable.
                        </p>
                        
                        <div className="bg-slate-950 p-3 rounded text-xs font-mono text-slate-300 mb-4 border border-slate-800">
                           Reduction % = MEM / (MEM + {MEM_CDR_DIMINISHING_FACTOR})
                        </div>

                        <div className="space-y-2">
                             <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                                 <span className="text-slate-500">10 MEM</span>
                                 <span className="text-purple-300 font-bold">~4.8% Reduction</span>
                             </div>
                             <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                                 <span className="text-slate-500">50 MEM</span>
                                 <span className="text-purple-300 font-bold">20.0% Reduction</span>
                             </div>
                             <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                                 <span className="text-slate-500">200 MEM</span>
                                 <span className="text-purple-300 font-bold">50.0% Reduction</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                                 <span className="text-slate-500">2000 MEM</span>
                                 <span className="text-purple-300 font-bold">~90.9% Reduction</span>
                             </div>
                        </div>
                    </div>

                    {/* Intelligence Mechanics */}
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                        <h3 className="text-blue-400 font-bold text-lg flex items-center gap-2 mb-4">
                            <Timer size={20} />
                            Intelligence (INT) Scaling
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Intelligence increases the <span className="text-white font-bold">Safe Limit</span> duration of abilities linearly. This directly combats Neural Heat generation by allowing longer active times.
                        </p>
                        
                        <div className="bg-slate-950 p-3 rounded text-xs font-mono text-slate-300 mb-4 border border-slate-800">
                           Duration Multiplier = 1 + (INT * {(INT_DURATION_SCALING_FACTOR).toFixed(3)})
                        </div>

                        <div className="space-y-2">
                             <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                                 <span className="text-slate-500">25 INT</span>
                                 <span className="text-blue-300 font-bold">+12.5% Duration</span>
                             </div>
                             <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                                 <span className="text-slate-500">50 INT</span>
                                 <span className="text-blue-300 font-bold">+25.0% Duration</span>
                             </div>
                             <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                                 <span className="text-slate-500">100 INT</span>
                                 <span className="text-blue-300 font-bold">+50.0% Duration</span>
                             </div>
                             <div className="flex items-center justify-between text-xs">
                                 <span className="text-slate-500">200 INT</span>
                                 <span className="text-blue-300 font-bold">+100.0% Duration (Double)</span>
                             </div>
                        </div>
                    </div>

                    {/* Charisma Mechanics */}
                    <div className="bg-pink-950/10 border border-pink-900/30 rounded-xl p-6">
                        <h3 className="text-pink-400 font-bold text-lg flex items-center gap-2 mb-4">
                            <Globe size={20} />
                            Charisma (CHA) Proficiency
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            CHA provides continuous scaling to social cognition, linguistics, and cross-species communication.
                        </p>
                        <div className="space-y-4">
                             <div className="text-xs bg-slate-900/50 p-3 rounded border border-pink-900/20">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-pink-300 font-bold">Skilled Human Tier</span>
                                     <span className="text-slate-500 font-mono">10-20 CHA</span>
                                 </div>
                                 <p className="text-slate-500 leading-tight">Reads conversations easily. Learns languages at a practiced pace.</p>
                             </div>
                             <div className="text-xs bg-slate-900/50 p-3 rounded border border-pink-900/20">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-pink-300 font-bold">Enhanced Specialist</span>
                                     <span className="text-slate-500 font-mono">50-100 CHA</span>
                                 </div>
                                 <p className="text-slate-500 leading-tight">Detects subtle anomalies. Adapts to unfamiliar cultures rapidly.</p>
                             </div>
                             <div className="text-xs bg-slate-900/50 p-3 rounded border border-pink-900/20">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-pink-300 font-bold">Cross-Species Competence</span>
                                     <span className="text-slate-500 font-mono">200-300 CHA</span>
                                 </div>
                                 <p className="text-slate-500 leading-tight">Recognizes intent in non-human communication. Avoids catastrophic misunderstandings.</p>
                             </div>
                             <div className="text-xs bg-slate-900/50 p-3 rounded border border-pink-900/20">
                                 <div className="flex justify-between items-center mb-1">
                                     <span className="text-pink-300 font-bold">Xenocognitive Expert</span>
                                     <span className="text-slate-500 font-mono">500+ CHA</span>
                                 </div>
                                 <p className="text-slate-500 leading-tight">Decodes unknown scripts. Maps patterns across radically different lifeforms. Neural clarity.</p>
                             </div>
                        </div>
                    </div>

                </div>
             </section>

          </div>
      </div>
    </div>
  );
};
