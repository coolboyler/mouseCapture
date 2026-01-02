
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ActionType, MacroAction, ExportFormat } from './types';
import { ICONS } from './constants';
import ActionItem from './components/ActionItem';
import { generateScript } from './services/scriptGenerator';
import { GoogleGenAI } from '@google/genai';

const App: React.FC = () => {
  const [actions, setActions] = useState<MacroAction[]>([
    { id: '1', type: ActionType.CLICK, x: 500, y: 300, button: 'left', jitter: true, comment: 'Open program' },
    { id: '2', type: ActionType.WAIT, duration: 1500, comment: 'Wait for load' },
    { id: '3', type: ActionType.KEYPRESS, key: 'Enter', comment: 'Confirm action' },
  ]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('AUTOHOTKEY');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  
  // Reference Image State
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activePickerActionId, setActivePickerActionId] = useState<string | null>(null);
  
  // Mouse tracking for picker
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, relX: 0, relY: 0 });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePickerActionId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const captureDesktop = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { cursor: "always" } as any 
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      setReferenceImage(dataUrl);
      
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handlePickerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate real coordinates based on image original size
    const img = e.currentTarget.querySelector('img');
    if (img) {
      const xRatio = x / rect.width;
      const yRatio = y / rect.height;
      const realX = Math.round(xRatio * img.naturalWidth);
      const realY = Math.round(yRatio * img.naturalHeight);
      setMousePos({ x, y, relX: realX, relY: realY });
    }
  };

  const handlePickerClick = () => {
    if (!activePickerActionId) return;
    updateAction(activePickerActionId, { x: mousePos.relX, y: mousePos.relY });
    setActivePickerActionId(null);
  };

  const addAction = (type: ActionType) => {
    const newAction: MacroAction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 0,
      y: 0,
      button: 'left',
      duration: 1000,
      key: 'Space',
      jitter: true,
      comment: '',
    };
    setActions([...actions, newAction]);
  };

  const deleteAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const updateAction = (id: string, updates: Partial<MacroAction>) => {
    setActions(actions.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const generatedCode = useMemo(() => generateScript(actions, exportFormat), [actions, exportFormat]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Code copied to clipboard!');
  };

  const getAiSuggestion = async () => {
    setIsAiLoading(true);
    setAiTip(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I have this automation macro sequence: ${JSON.stringify(actions)}. Give me one expert tip on how to make it more human-like or robust for Windows automation. Keep it under 30 words.`,
      });
      setAiTip(response.text || "Ensure delays vary slightly between repeats to avoid bot detection.");
    } catch (err) {
      setAiTip("Tip: Use slightly random sleep durations (e.g. 1000ms-1200ms) to bypass simple anti-cheat systems.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Coordinate Picker Overlay */}
      {activePickerActionId && referenceImage && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-200 cursor-none">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-xl animate-bounce">
              Click to capture: X={mousePos.relX}, Y={mousePos.relY}
            </div>
            <span className="text-slate-400 text-xs">Press ESC to cancel</span>
          </div>
          
          <div 
            className="relative border-2 border-blue-500 shadow-2xl max-w-full max-h-[85vh] overflow-hidden rounded-lg group"
            onMouseMove={handlePickerMouseMove}
            onClick={handlePickerClick}
          >
            <img src={referenceImage} alt="Desktop Capture" className="object-contain block w-full h-full pointer-events-none" />
            
            {/* Crosshair Lines */}
            <div className="absolute inset-0 pointer-events-none">
               <div 
                className="w-full h-[1px] bg-red-500/50 absolute shadow-[0_0_5px_rgba(239,68,68,0.5)]" 
                style={{ top: mousePos.y }}
               ></div>
               <div 
                className="h-full w-[1px] bg-red-500/50 absolute shadow-[0_0_5px_rgba(239,68,68,0.5)]" 
                style={{ left: mousePos.x }}
               ></div>
               {/* Center circle */}
               <div 
                className="w-6 h-6 border-2 border-red-500 rounded-full absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: mousePos.x, top: mousePos.y }}
               ></div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <ICONS.Click className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">MacroForge <span className="text-slate-500 font-normal text-sm ml-2">Studio</span></h1>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={captureDesktop}
            disabled={isCapturing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all border group relative ${referenceImage ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 hover:bg-emerald-600/30' : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]'}`}
          >
            <ICONS.Camera className={`w-4 h-4 ${isCapturing ? 'animate-pulse' : ''}`} />
            {isCapturing ? "Capturing..." : referenceImage ? "Refresh Screen" : "1. Capture Screen First"}
            {!referenceImage && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
          </button>
           <button 
            onClick={getAiSuggestion}
            disabled={isAiLoading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
          >
            {isAiLoading ? "Thinking..." : "AI Suggestion"}
          </button>
          <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
            <button 
              onClick={() => setExportFormat('AUTOHOTKEY')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${exportFormat === 'AUTOHOTKEY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              AutoHotkey
            </button>
            <button 
              onClick={() => setExportFormat('PYTHON_PYAUTOGUI')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${exportFormat === 'PYTHON_PYAUTOGUI' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Python
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        
        {/* Left: Action Builder */}
        <section className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-900/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Macro Timeline 
                {!referenceImage && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded border border-amber-500/30 uppercase">Step 1 Required</span>}
              </h2>
              <p className="text-sm text-slate-500">Add actions and pick their screen locations</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => addAction(ActionType.CLICK)} className="action-btn text-blue-400 border-blue-600/30 bg-blue-600/10 hover:bg-blue-600/20"><ICONS.Plus className="w-4 h-4" /> Click</button>
              <button onClick={() => addAction(ActionType.WAIT)} className="action-btn text-amber-400 border-amber-600/30 bg-amber-600/10 hover:bg-amber-600/20"><ICONS.Plus className="w-4 h-4" /> Wait</button>
              <button onClick={() => addAction(ActionType.KEYPRESS)} className="action-btn text-emerald-400 border-emerald-600/30 bg-emerald-600/10 hover:bg-emerald-600/20"><ICONS.Plus className="w-4 h-4" /> Key</button>
              <button onClick={() => addAction(ActionType.MOVE)} className="action-btn text-purple-400 border-purple-600/30 bg-purple-600/10 hover:bg-purple-600/20"><ICONS.Plus className="w-4 h-4" /> Move</button>
            </div>
          </div>

          <div className="space-y-3">
            {actions.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600">
                <ICONS.Plus className="w-12 h-12 mb-4 opacity-20" />
                <p>Start by adding an action above</p>
              </div>
            ) : (
              actions.map((action, index) => (
                <div key={action.id} className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-800"></div>
                  <div className="absolute left-1.5 top-6 w-3.5 h-3.5 rounded-full border-2 border-slate-800 bg-slate-900 z-10"></div>
                  <ActionItem 
                    action={action} 
                    onDelete={deleteAction} 
                    onUpdate={updateAction} 
                    onPickStart={setActivePickerActionId}
                    hasReference={!!referenceImage}
                  />
                </div>
              ))
            )}
          </div>

          {aiTip && (
             <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-indigo-500 p-1.5 rounded-lg flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-300 uppercase mb-1">AI Expert Advice</h4>
                  <p className="text-sm text-slate-300 italic">"{aiTip}"</p>
                </div>
             </div>
          )}
        </section>

        {/* Right: Code Preview */}
        <section className="w-full lg:w-[450px] bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div>
              <h3 className="font-semibold">Script Preview</h3>
              <p className="text-xs text-slate-500">Ready to run offline</p>
            </div>
            <button onClick={copyToClipboard} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20">
              Copy Script
            </button>
          </div>
          
          <div className="flex-grow overflow-auto p-4 bg-slate-950 font-mono text-sm relative">
            <pre className="text-slate-300 whitespace-pre-wrap code-font leading-relaxed">
              <code>{generatedCode}</code>
            </pre>
            
            <div className="absolute bottom-4 left-4 right-4 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                How to Pick Coordinates
              </h4>
              <ul className="text-xs text-slate-400 space-y-3 pl-4">
                <li><b className="text-slate-200">1. Click "Capture Screen":</b> Select the window or screen you want to automate.</li>
                <li><b className="text-slate-200">2. Use Crosshair:</b> Click the <ICONS.Crosshair className="inline w-3 h-3 text-blue-400" /> icon next to any Click/Move action.</li>
                <li><b className="text-slate-200">3. Aim & Click:</b> In the overlay, move the red lines to your target and click. The X/Y will auto-fill.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          border-width: 1px;
          transition: all 0.2s;
        }
      `}</style>

      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2 text-[10px] text-slate-600 flex justify-between items-center">
        <span>© 2024 MacroForge Studio - Windows Native Automation</span>
        <div className="flex gap-4 uppercase font-bold tracking-widest">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Engine Ready</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Precision Tooling</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
