import {
  Home,
  BookOpen,
  Clock,
  Star,
  FileText,
  User,
  LogOut,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Zap,
  ArrowRight,
  Calendar,
  Play,
  Check,
  Share2,
  Download,
  Layers,
  Layout,
  Activity,
  Lock,
  Info,
  ChevronRight,
  Key,
  Sun,
  Bell,
  Edit3,
  Plus,
  Menu,
  X
} from 'lucide-react';

const iconMap = {
  'home': Home,
  'book-open': BookOpen,
  'clock': Clock,
  'star': Star,
  'file-text': FileText,
  'user': User,
  'log-out': LogOut,
  'check-circle': CheckCircle,
  'trending-up': TrendingUp,
  'alert-circle': AlertCircle,
  'zap': Zap,
  'arrow-right': ArrowRight,
  'calendar': Calendar,
  'play': Play,
  'check': Check,
  'share-2': Share2,
  'download': Download,
  'layers': Layers,
  'layout': Layout,
  'activity': Activity,
  'lock': Lock,
  'info': Info,
  'chevron-right': ChevronRight,
  'key': Key,
  'sun': Sun,
  'bell': Bell,
  'edit-3': Edit3,
  'plus': Plus,
  'menu': Menu,
  'x': X
};

export default function Icon({ name, ...props }) {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Icon.jsx mapping.`);
    return <Layout {...props} />;
  }
  return <IconComponent {...props} />;
}
