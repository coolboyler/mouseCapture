
import { MacroAction, ActionType, ExportFormat } from '../types';

export const generateScript = (actions: MacroAction[], format: ExportFormat): string => {
  if (format === 'AUTOHOTKEY') {
    return generateAHK(actions);
  } else {
    return generatePython(actions);
  }
};

const generateAHK = (actions: MacroAction[]): string => {
  let script = `; MacroForge Generated AutoHotkey Script\n`;
  script += `; Press F1 to Start, F2 to Pause, F3 to Exit\n\n`;
  script += `F1::\nLoop {\n`;

  actions.forEach(action => {
    switch (action.type) {
      case ActionType.CLICK:
        const btn = action.button === 'right' ? 'Right' : (action.button === 'middle' ? 'Middle' : 'Left');
        if (action.jitter) {
          script += `    Random, rx, -3, 3\n    Random, ry, -3, 3\n`;
          script += `    Click, ${action.x ?? 0} + rx, ${action.y ?? 0} + ry, ${btn}\n`;
        } else {
          script += `    Click, ${action.x ?? 0}, ${action.y ?? 0}, ${btn}\n`;
        }
        break;
      case ActionType.MOVE:
        script += `    MouseMove, ${action.x ?? 0}, ${action.y ?? 0}\n`;
        break;
      case ActionType.WAIT:
        script += `    Sleep, ${action.duration ?? 1000}\n`;
        break;
      case ActionType.KEYPRESS:
        script += `    Send, {${action.key ?? 'Space'}}\n`;
        break;
    }
    if (action.comment) script += `    ; ${action.comment}\n`;
  });

  script += `}\nreturn\n\nF2::Pause\nF3::ExitApp`;
  return script;
};

const generatePython = (actions: MacroAction[]): string => {
  let script = `import pyautogui\nimport time\nimport random\n\n`;
  script += `# MacroForge Generated Python Script\n# Dependencies: pip install pyautogui\n\n`;
  script += `print("Macro starting in 3 seconds... Switch to your target window.")\ntime.sleep(3)\n\n`;
  script += `try:\n    while True:\n`;

  actions.forEach(action => {
    switch (action.type) {
      case ActionType.CLICK:
        if (action.jitter) {
          script += `        pyautogui.click(${action.x ?? 0} + random.randint(-3, 3), ${action.y ?? 0} + random.randint(-3, 3), button='${action.button ?? 'left'}')\n`;
        } else {
          script += `        pyautogui.click(${action.x ?? 0}, ${action.y ?? 0}, button='${action.button ?? 'left'}')\n`;
        }
        break;
      case ActionType.MOVE:
        script += `        pyautogui.moveTo(${action.x ?? 0}, ${action.y ?? 0})\n`;
        break;
      case ActionType.WAIT:
        script += `        time.sleep(${(action.duration ?? 1000) / 1000})\n`;
        break;
      case ActionType.KEYPRESS:
        script += `        pyautogui.press('${action.key?.toLowerCase() ?? 'space'}')\n`;
        break;
    }
  });

  script += `except KeyboardInterrupt:\n    print("\\nStopped.")\n`;
  return script;
};
