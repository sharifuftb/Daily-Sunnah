
export type Category = 'সকাল' | 'খাবার' | 'ঘুম' | 'সাধারণ' | 'মসজিদ';

// Added SquareValue type to fix "Module has no exported member 'SquareValue'" errors in Tic-Tac-Toe related files
export type SquareValue = 'X' | 'O' | null;

export interface SunnahItem {
  id: number;
  title: string;
  description: string;
  category: Category;
  reference?: string;
  completed?: boolean;
}

export interface VirtueItem {
  id: number;
  title: string;
  benefit: string;
  reference: string;
  icon: string;
}

export interface AppState {
  dailySunnah: SunnahItem;
  allSunnahs: SunnahItem[];
  selectedCategory: Category | 'সব';
}
