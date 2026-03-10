export interface Review {
  name: string;
  role: string;
  date?: string;
  content: string;
  image?: string;
  video?: string;
  rating?: number;
}

export interface PortfolioItem {
  src: string;
  span: string; // Tailwind grid span class
  alt: string;
}

export interface NavItem {
  label: string;
  href: string;
}