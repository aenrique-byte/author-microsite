import React from 'react';
import { Download, CheckCircle, XCircle, Circle } from 'lucide-react';
import { Character, Quest } from '../types';

interface QuestSystemProps {
  character: Character;
  quests: Quest[];
  addQuest: (q: Quest) => void;
  updateQuestStatus: (id: string, status: Quest['status']) => void;
}

export const QuestSystem: React.FC<QuestSystemProps> = ({ character, quests, updateQuestStatus }) => {

  const exportMarkdown = () => {
    const md = `# ${character.name} - Level ${character.level} ${character.className}
## Attributes
${Object.entries(character.attributes).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

## Quest Log
${quests.map(q => `
### ${q.title} (${q.status.toUpperCase()})
> ${q.description}
- **Steps**:
${q.steps.map(s => `  - [ ] ${s}`).join('\n')}
- **Rewards**: ${q.rewards}
`).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.name.replace(/\s+/g, '_')}_Log.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
         <button 
           onClick={exportMarkdown}
           className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 py-2 rounded-lg transition-all"
         >
           <Download size={18} />
           <span>Export Data</span>
         </button>
      </div>

      <div className="space-y-4">
        {quests.length === 0 && (
          <div className="text-center text-slate-500 py-8 italic">
            No active contracts. Quest management will be available in Phase 2.
          </div>
        )}
        {quests.map(quest => (
          <div key={quest.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-start mb-2">
               <h4 className="font-bold text-slate-200">{quest.title}</h4>
               <div className="flex gap-1">
                 <button onClick={() => updateQuestStatus(quest.id, 'active')} className={`p-1 rounded ${quest.status === 'active' ? 'text-blue-400' : 'text-slate-600'}`}><Circle size={16}/></button>
                 <button onClick={() => updateQuestStatus(quest.id, 'completed')} className={`p-1 rounded ${quest.status === 'completed' ? 'text-green-400' : 'text-slate-600'}`}><CheckCircle size={16}/></button>
                 <button onClick={() => updateQuestStatus(quest.id, 'failed')} className={`p-1 rounded ${quest.status === 'failed' ? 'text-red-400' : 'text-slate-600'}`}><XCircle size={16}/></button>
               </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">{quest.description}</p>
            
            <div className="space-y-1 mb-3">
              {quest.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-slate-600 mt-0.5">•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            
            <div className="text-xs text-nexus-warn bg-nexus-warn/10 p-2 rounded border border-nexus-warn/20 inline-block">
              Reward: {quest.rewards}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
