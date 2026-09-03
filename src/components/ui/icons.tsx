import React from "react";
import {
  Film,
  Palette,
  Landmark,
  BookOpen,
  Brain,
  Atom,
  Globe,
  Shield,
  Trophy,
  Music,
  Zap,
  Crosshair,
  Flame,
  Clock,
  MessageSquareQuote,
  HelpCircle,
  Search,
  Settings,
  User,
  Volume2,
  VolumeX,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Info,
  AlertCircle,
  ArrowRight,
  Lock,
  RefreshCw,
  Play,
  Radio,
  Users,
  Target,
  Sparkles,
  Award,
  Crown,
  Gem,
  Swords,
  Scroll,
  TrendingUp,
  type LucideProps,
} from "lucide-react";

export type IconName =
  | "cinema"
  | "art"
  | "philosophie"
  | "litterature"
  | "sciences-humaines"
  | "science"
  | "geographie"
  | "histoire"
  | "sport"
  | "musique"
  | "bronze"
  | "argent"
  | "or"
  | "platine"
  | "diamant"
  | "elite"
  | "prism"
  | "classic"
  | "rapidfire"
  | "timeline"
  | "debate"
  | "wyr"
  | "guess"
  | "teambattle"
  | "psycho"
  | "zap"
  | "flame"
  | "trophy"
  | "settings"
  | "user"
  | "sound-on"
  | "sound-off"
  | "check"
  | "cross"
  | "arrow-right"
  | "chevron-right"
  | "clock"
  | "shield"
  | "swords"
  | "target";

interface AppIconProps extends LucideProps {
  name: IconName | string;
  className?: string;
  size?: number;
}

export function AppIcon({ name, className = "w-4 h-4", size, ...props }: AppIconProps) {
  const iconProps = { className, size, ...props };

  switch (name.toLowerCase()) {
    // Spécialités
    case "cinema":
    case "film":
      return <Film {...iconProps} />;
    case "art":
    case "palette":
      return <Palette {...iconProps} />;
    case "philosophie":
    case "landmark":
      return <Landmark {...iconProps} />;
    case "litterature":
    case "book":
      return <BookOpen {...iconProps} />;
    case "sciences-humaines":
    case "brain":
      return <Brain {...iconProps} />;
    case "science":
    case "atom":
      return <Atom {...iconProps} />;
    case "geographie":
    case "globe":
      return <Globe {...iconProps} />;
    case "histoire":
    case "history":
      return <Scroll {...iconProps} />;
    case "sport":
      return <Trophy {...iconProps} />;
    case "musique":
    case "music":
      return <Music {...iconProps} />;

    // Ligues
    case "bronze":
      return <Shield {...iconProps} />;
    case "argent":
      return <Award {...iconProps} />;
    case "or":
      return <Crown {...iconProps} />;
    case "platine":
      return <Sparkles {...iconProps} />;
    case "diamant":
      return <Gem {...iconProps} />;
    case "elite":
      return <Flame {...iconProps} />;

    // Modes
    case "prism":
      return <Zap {...iconProps} />;
    case "classic":
      return <Crosshair {...iconProps} />;
    case "rapidfire":
      return <Flame {...iconProps} />;
    case "timeline":
      return <Clock {...iconProps} />;
    case "debate":
      return <MessageSquareQuote {...iconProps} />;
    case "wyr":
      return <HelpCircle {...iconProps} />;
    case "guess":
      return <Search {...iconProps} />;
    case "teambattle":
      return <Users {...iconProps} />;
    case "psycho":
      return <Brain {...iconProps} />;

    // UI
    case "zap":
      return <Zap {...iconProps} />;
    case "flame":
      return <Flame {...iconProps} />;
    case "trophy":
      return <Trophy {...iconProps} />;
    case "settings":
      return <Settings {...iconProps} />;
    case "user":
      return <User {...iconProps} />;
    case "sound-on":
      return <Volume2 {...iconProps} />;
    case "sound-off":
      return <VolumeX {...iconProps} />;
    case "check":
      return <Check {...iconProps} />;
    case "cross":
    case "x":
      return <X {...iconProps} />;
    case "arrow-right":
      return <ArrowRight {...iconProps} />;
    case "chevron-right":
      return <ChevronRight {...iconProps} />;
    case "chevron-left":
      return <ChevronLeft {...iconProps} />;
    case "clock":
      return <Clock {...iconProps} />;
    case "shield":
      return <Shield {...iconProps} />;
    case "swords":
      return <Swords {...iconProps} />;
    case "target":
      return <Target {...iconProps} />;
    case "lock":
      return <Lock {...iconProps} />;
    case "refresh":
      return <RefreshCw {...iconProps} />;
    case "play":
      return <Play {...iconProps} />;
    case "radio":
      return <Radio {...iconProps} />;
    case "trending-up":
      return <TrendingUp {...iconProps} />;
    case "info":
      return <Info {...iconProps} />;
    case "alert":
      return <AlertCircle {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
}
