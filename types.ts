
export interface OutlineSection {
  section: string;
  subsections: string[];
}

export interface OutlineData {
  title: string;
  outline: OutlineSection[];
}

export interface SavedOutline extends OutlineData {
  id: string;
  createdAt: number;
}
