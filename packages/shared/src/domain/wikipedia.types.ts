export interface WikipediaPage {
  slug: string;
  title: string;
  htmlContent: string;
}

export interface NavigationStep {
  from: string;
  to: string;
  timestamp: number;
}
