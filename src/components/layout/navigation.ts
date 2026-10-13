import {
  BookOpen,
  BookText,
  FolderKanban,
  LayoutDashboard,
  Library,
  Presentation,
  Settings2,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const primaryNavigation: NavigationItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Sermones", to: "/sermons", icon: BookOpen },
  { label: "Estudios", to: "/studies", icon: BookText },
  { label: "Series", to: "/series", icon: FolderKanban },
  { label: "Discipulado", to: "/discipleship", icon: UsersRound },
  { label: "Biblioteca", to: "/library", icon: Library },
  { label: "Proyección", to: "/presentation/demo", icon: Presentation },
];

export const utilityNavigation: NavigationItem[] = [
  { label: "Configuración", to: "/settings", icon: Settings2 },
];
