
export enum ActionType {
  CLICK = 'CLICK',
  MOVE = 'MOVE',
  WAIT = 'WAIT',
  KEYPRESS = 'KEYPRESS',
  LOOP_START = 'LOOP_START',
  LOOP_END = 'LOOP_END'
}

export interface MacroAction {
  id: string;
  type: ActionType;
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  key?: string;
  duration?: number; // for wait or hold
  repeat?: number;
  jitter?: boolean; // add small randomness to mimic humans
  comment?: string;
}

export type ExportFormat = 'AUTOHOTKEY' | 'PYTHON_PYAUTOGUI';
