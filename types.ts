
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

export interface ArticleContentPart {
  section: string;
  content: string;
}

export interface SavedArticle {
  id: string;
  createdAt: number;
  outline: OutlineData;
  content: ArticleContentPart[];
}
