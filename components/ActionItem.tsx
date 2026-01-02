
import React from 'react';
import { MacroAction, ActionType } from '../types';
import { ICONS } from '../constants';

interface ActionItemProps {
  action: MacroAction;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MacroAction>) => void;
  onPickStart: (id: string) => void;
  hasReference: boolean;
}

const ActionItem: React.FC<ActionItemProps> = ({ action, onDelete, onUpdate, onPickStart, hasReference }) => {
  const renderIcon = () => {
    switch (action.type) {
      case ActionType.CLICK: return <ICONS.Click className="text-blue-400" />;
      case ActionType.WAIT: return <ICONS.Wait className="text-amber-400" />;
      case ActionType.KEYPRESS: return <ICONS.Key className="text-emerald-400" />;
      case ActionType.MOVE: return <ICONS.Move className="text-purple-400" />;
      default: return null;
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center gap-4 group transition-all hover:border-slate-500 hover:bg-slate-800">
      <div className="flex-shrink-0 bg-slate-900 p-2 rounded-lg">
        {renderIcon()}
      </div>
      
      <div className="flex-grow grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Type</label>
          <span className="text-sm font-semibold">{action.type}</span>
        </div>

        {(action.type === ActionType.CLICK || action.type === ActionType.MOVE) && (
          <>
            <div className="flex flex-col relative">
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">X Coord</label>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={action.x} 
                  onChange={(e) => onUpdate(action.id, { x: parseInt(e.target.value) || 0 })}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-full"
                />
                <button 
                  onClick={() => onPickStart(action.id)}
                  title={hasReference ? "Pick from screen" : "Capture screen first"}
                  className={`p-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-blue-600 hover:border-blue-500 transition-colors ${!hasReference ? 'opacity-30 cursor-not-allowed' : ''}`}
                  disabled={!hasReference}
                >
                  <ICONS.Crosshair className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Y Coord</label>
              <input 
                type="number" 
                value={action.y} 
                onChange={(e) => onUpdate(action.id, { y: parseInt(e.target.value) || 0 })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </>
        )}

        {action.type === ActionType.WAIT && (
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Duration (ms)</label>
            <input 
              type="number" 
              value={action.duration} 
              onChange={(e) => onUpdate(action.id, { duration: parseInt(e.target.value) || 0 })}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            />
          </div>
        )}

        {action.type === ActionType.KEYPRESS && (
          <div className="flex flex-col">
            <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Key</label>
            <input 
              type="text" 
              value={action.key} 
              onChange={(e) => onUpdate(action.id, { key: e.target.value })}
              placeholder="e.g. Enter, Space, a"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="text-[10px] text-slate-500 uppercase font-bold mb-1">Comment</label>
          <input 
            type="text" 
            value={action.comment} 
            onChange={(e) => onUpdate(action.id, { comment: e.target.value })}
            placeholder="What does this do?"
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-slate-500 outline-none"
          />
        </div>
      </div>

      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onDelete(action.id)}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
        >
          <ICONS.Trash />
        </button>
      </div>
    </div>
  );
};

export default ActionItem;
