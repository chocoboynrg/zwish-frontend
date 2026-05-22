import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';

import { LucideAngularModule } from 'lucide-angular';
import {
  // Navigation & layout
  Home, Menu, LayoutDashboard, Grid, List,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  ExternalLink, Link, Copy,
  // Actions
  Plus, Minus, X, Check, RefreshCw, RefreshCcw,
  Search, Filter, SlidersHorizontal,
  Edit, Edit2, Pencil, Trash2, Save,
  Download, Upload, Send,
  MoreHorizontal, MoreVertical,
  // Status & feedback
  AlertCircle, AlertTriangle, Info,
  CheckCircle2, XCircle, CircleHelp,
  Loader2, Zap,
  // User & auth
  User, Users, UserPlus, UserCheck,
  LogIn, LogOut, Lock, Unlock,
  Eye, EyeOff, Shield, ShieldCheck,
  // Communication
  Mail, Bell, BellOff, MessageSquare, Phone, Globe,
  // Calendar & time
  Calendar, Clock, Timer, History,
  // Finance & commerce
  CreditCard, DollarSign, Wallet, Receipt,
  ShoppingCart, ShoppingBag, Tag, Store,
  BarChart2, TrendingUp, TrendingDown, Activity,
  // Items & delivery
  Package, Truck, MapPin, Star,
  // Files & content
  FileText, File, Folder, FolderOpen, Clipboard,
  ClipboardList, ClipboardCheck, BookOpen,
  Image, ImageOff,
  // Misc
  Hash, Percent, Award, Gift, Heart, Settings,
  Building2, Landmark, Boxes,
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideZoneChangeDetection({
      eventCoalescing: true,
    }),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([
        authInterceptor,
        loadingInterceptor,
        apiErrorInterceptor,
      ])
    ),

    importProvidersFrom(LucideAngularModule.pick({
      // Navigation & layout
      Home, Menu, LayoutDashboard, Grid, List,
      ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
      ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
      ExternalLink, Link, Copy,
      // Actions
      Plus, Minus, X, Check, RefreshCw, RefreshCcw,
      Search, Filter, SlidersHorizontal,
      Edit, Edit2, Pencil, Trash2, Save,
      Download, Upload, Send,
      MoreHorizontal, MoreVertical,
      // Status & feedback
      AlertCircle, AlertTriangle, Info,
      CheckCircle2, XCircle, CircleHelp,
      Loader2, Zap,
      // User & auth
      User, Users, UserPlus, UserCheck,
      LogIn, LogOut, Lock, Unlock,
      Eye, EyeOff, Shield, ShieldCheck,
      // Communication
      Mail, Bell, BellOff, MessageSquare, Phone, Globe,
      // Calendar & time
      Calendar, Clock, Timer, History,
      // Finance & commerce
      CreditCard, DollarSign, Wallet, Receipt,
      ShoppingCart, ShoppingBag, Tag, Store,
      BarChart2, TrendingUp, TrendingDown, Activity,
      // Items & delivery
      Package, Truck, MapPin, Star,
      // Files & content
      FileText, File, Folder, FolderOpen, Clipboard,
      ClipboardList, ClipboardCheck, BookOpen,
      Image, ImageOff,
      // Misc
      Hash, Percent, Award, Gift, Heart, Settings,
      Building2, Landmark, Boxes,
    })),
  ],
};