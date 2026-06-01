"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Award, Banknote,
  BarChart3, Battery, Box, Briefcase, Building2, Calendar, Car, CheckCircle2,
  CircleDollarSign, Clock, Code, Coffee, CreditCard, Cpu, Database, DollarSign,
  Droplet, Eye, Factory, Flame, Fuel, Gauge, Globe, GraduationCap, Hash, Heart,
  Home, Layers, Leaf, Lightbulb, LineChart, MapPin, Network, Package, Percent,
  PieChart, Plane, Quote, Recycle, Rocket, Scale, Server, ShieldCheck,
  ShoppingCart, Smartphone, Sparkles, Star, Stethoscope, Sun, Target,
  Thermometer, TreePine, TrendingDown, TrendingUp, Trophy, Truck, User, Users,
  Wifi, Zap,
} from "lucide-react";

/**
 * Semantic icon engine.
 *
 * The studio agent tags sections / data points with a short semantic token
 * (one of ICON_TOKENS). `resolveIcon` maps that token to a lucide-react icon,
 * with a keyword fallback that infers an icon from nearby text when no token
 * is supplied. Returns null when nothing sensible matches so callers can fall
 * back to their existing (icon-free) rendering — never a misleading icon.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // finance
  money: DollarSign,
  revenue: CircleDollarSign,
  profit: TrendingUp,
  loss: TrendingDown,
  cost: Banknote,
  price: CreditCard,
  investment: Briefcase,
  // trend
  growth: TrendingUp,
  increase: ArrowUpRight,
  decline: TrendingDown,
  decrease: ArrowDownRight,
  // people
  people: Users,
  person: User,
  population: Users,
  users: Users,
  customers: ShoppingCart,
  audience: Eye,
  // time
  time: Clock,
  year: Calendar,
  date: Calendar,
  speed: Gauge,
  // geo
  global: Globe,
  country: MapPin,
  location: MapPin,
  region: Globe,
  // business
  company: Building2,
  industry: Factory,
  factory: Factory,
  market: BarChart3,
  work: Briefcase,
  // tech
  technology: Cpu,
  computer: Cpu,
  mobile: Smartphone,
  internet: Wifi,
  data: Database,
  code: Code,
  network: Network,
  cloud: Server,
  security: ShieldCheck,
  // general
  chart: BarChart3,
  pie: PieChart,
  trend: LineChart,
  percent: Percent,
  warning: AlertTriangle,
  success: CheckCircle2,
  energy: Zap,
  target: Target,
  award: Award,
  idea: Lightbulb,
  launch: Rocket,
  fire: Flame,
  star: Star,
  quote: Quote,
  sparkle: Sparkles,
  trophy: Trophy,
  layers: Layers,
  box: Box,
  package: Package,
  scale: Scale,
  activity: Activity,
  hash: Hash,
  // domains
  shopping: ShoppingCart,
  coffee: Coffee,
  car: Car,
  transport: Truck,
  flight: Plane,
  health: Stethoscope,
  heart: Heart,
  education: GraduationCap,
  environment: TreePine,
  nature: Leaf,
  water: Droplet,
  sun: Sun,
  temperature: Thermometer,
  recycle: Recycle,
  battery: Battery,
  fuel: Fuel,
  home: Home,
};

/** Token list injected into the agent prompt so it picks from a known set. */
export const ICON_TOKENS = Object.keys(ICON_MAP);

const KEYWORD_FALLBACKS: Array<[RegExp, string]> = [
  [/revenue|sales|\$|money|dollar|usd|funding|capital/i, "money"],
  [/profit|gain|surge|soar|up\b|rise|rising|grew|growth/i, "growth"],
  [/loss|drop|fall|fell|decline|crash|plunge|down\b|shrink/i, "decline"],
  [/cost|expense|spend|budget/i, "cost"],
  [/price|pricing|fee/i, "price"],
  [/people|population|adult|citizen|household|user|subscriber/i, "people"],
  [/customer|consumer|shopper|buyer|purchase/i, "customers"],
  [/year|annual|decade|century|month|day|hour|minute/i, "time"],
  [/speed|fast|latency|throughput/i, "speed"],
  [/global|world|international|country|nation|region|map/i, "global"],
  [/compan(y|ies)|firm|corporat|business|enterprise/i, "company"],
  [/industr|factor|manufactur|production/i, "industry"],
  [/market|share|sector/i, "market"],
  [/tech|software|digital|comput|processor|chip/i, "technology"],
  [/mobile|phone|smartphone|app\b/i, "mobile"],
  [/internet|online|web|wifi|connect/i, "internet"],
  [/\bdata\b|dataset|database|storage/i, "data"],
  [/security|secure|privacy|encrypt|protect/i, "security"],
  [/ai|machine learning|neural|model|algorithm/i, "technology"],
  [/energy|power|electric|watt/i, "energy"],
  [/percent|%|rate|ratio|proportion/i, "percent"],
  [/risk|warning|danger|threat|crisis/i, "warning"],
  [/success|achiev|complete|win|won/i, "success"],
  [/award|prize|medal|champion|best/i, "award"],
  [/idea|innovat|invent|concept/i, "idea"],
  [/launch|start|begin|debut/i, "launch"],
  [/coffee|drink|beverage|cup/i, "coffee"],
  [/car|vehicle|auto|drive/i, "car"],
  [/ship|delivery|logistic|freight/i, "transport"],
  [/flight|airline|airplane|aviation/i, "flight"],
  [/health|medical|hospital|patient|disease|clinic/i, "health"],
  [/educat|school|university|student|learn/i, "education"],
  [/environment|climate|carbon|emission|sustainab/i, "environment"],
  [/water|ocean|river|liquid/i, "water"],
  [/solar|sunlight|daylight/i, "sun"],
  [/temperature|heat|warm|cold|degree/i, "temperature"],
];

function normalize(token?: string): string | undefined {
  if (!token) return undefined;
  return token.toLowerCase().trim().replace(/[^a-z]/g, "");
}

/**
 * Resolve a lucide icon from an explicit token first, then by scanning text
 * hints (heading, label, value). Returns null when nothing matches.
 */
export function resolveIcon(
  token?: string,
  ...textHints: Array<string | undefined>
): LucideIcon | null {
  const key = normalize(token);
  if (key && ICON_MAP[key]) return ICON_MAP[key];

  const hay = textHints.filter(Boolean).join(" ");
  if (hay) {
    for (const [re, mapKey] of KEYWORD_FALLBACKS) {
      if (re.test(hay)) return ICON_MAP[mapKey] ?? null;
    }
  }
  return null;
}

/** Resolve with a guaranteed fallback icon (for icon-dense regions). */
export function resolveIconOr(
  fallback: LucideIcon,
  token?: string,
  ...textHints: Array<string | undefined>
): LucideIcon {
  return resolveIcon(token, ...textHints) ?? fallback;
}
