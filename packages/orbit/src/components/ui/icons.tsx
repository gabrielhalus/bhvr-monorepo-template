import type { IconSvgElement } from "@hugeicons/react";

/**
 * Icon shim — Orbit uses HugeIcons under lucide-compatible names.
 * Each export wraps `HugeiconsIcon` so call sites keep the
 * `<Name className="h-4 w-4" />` form; only the import source changes.
 * Mapping: lucide name -> @hugeicons/core-free-icons export.
 */
import {
  // Additional glyphs used by the earl-la-drevenne `app` (domain nav + chrome + forms).
  Alert01Icon,
  Alert02Icon,
  ArrowDown01Icon,
  ArrowDownRight02Icon,
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  ArrowTurnBackwardIcon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  ArrowUpRight01Icon,
  Attachment01Icon,
  BankIcon,
  BatteryMediumIcon,
  BoxIcon,
  BubbleChatIcon,
  BugIcon,
  Building06Icon,
  Calendar01Icon,
  CalendarSetting01Icon,
  Call02Icon,
  Cancel01Icon,
  CancelCircleIcon,
  CheckmarkBadge02Icon,
  CheckmarkCircle02Icon,
  CheckmarkSquare02Icon,
  ChefHatIcon,
  CircleIcon,
  ClipboardCheckIcon,
  ClipboardIcon,
  ClipboardListIcon,
  Clock01Icon,
  CloudIcon,
  CloudUploadIcon,
  ComponentIcon,
  ComputerArrowDownIcon,
  ComputerIcon,
  ContactIcon,
  Copy01Icon,
  CreditCardIcon,
  CrownIcon,
  DashboardSquare01Icon,
  Database01Icon,
  DatabaseBackupIcon,
  Delete02Icon,
  DollarCircleIcon,
  Download01Icon,
  Edit01Icon,
  EuroCircleIcon,
  FileAddIcon,
  FileCodeIcon,
  FilterIcon,
  Flag01Icon,
  FlashIcon,
  FloppyDiskIcon,
  Folder01Icon,
  FolderManagementIcon,
  FolderOpenIcon,
  GitCommitIcon,
  GithubIcon,
  GlobeIcon,
  GridViewIcon,
  HardDriveIcon,
  HelpCircleIcon,
  HistoryIcon,
  Home01Icon,
  ImageAdd01Icon,
  InformationCircleIcon,
  Invoice01Icon,
  Key01Icon,
  Key02Icon,
  Layers01Icon,
  LeftToRightListNumberIcon,
  LifebuoyIcon,
  LinkSquare02Icon,
  ListViewIcon,
  Loading03Icon,
  Location01Icon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  Menu01Icon,
  Message01Icon,
  MinusSignIcon,
  Moon02Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  PackageRemoveIcon,
  PaintBoardIcon,
  PencilEdit01Icon,
  PercentIcon,
  PinIcon,
  PlayIcon,
  PlusSignIcon,
  PrinterIcon,
  RefreshIcon,
  Search01Icon,
  SecurityIcon,
  Sent02Icon,
  Settings01Icon,
  Settings02Icon,
  Share08Icon,
  ShoppingCart01Icon,
  SidebarLeftIcon,
  SidebarTopIcon,
  SignalIcon,
  SmartPhone01Icon,
  StatusIcon,
  StickyNote01Icon,
  Sun03Icon,
  Tag01Icon,
  Task01Icon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  Tick02Icon,
  TranslateIcon,
  Upload01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  UserIcon,
  UserMultipleIcon,
  Video01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  Wallet01Icon,
  Wifi01Icon,
  Xls01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { forwardRef } from "react";

export type IconProps = Omit<
  React.ComponentPropsWithoutRef<typeof HugeiconsIcon>,
  "icon"
>;

/** Type for an icon export from this module (drop-in for the old LucideIcon). */
export type IconComponent = React.ComponentType<IconProps>;

/** Build a named, ref-forwarding icon bound to a HugeIcons glyph. */
function icon(glyph: IconSvgElement, name: string) {
  const Icon = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
    <HugeiconsIcon ref={ref} icon={glyph} {...props} />
  ));
  Icon.displayName = name;
  return Icon;
}

export const AlignCenter = /* #__PURE__ */ icon(TextAlignCenterIcon, "AlignCenter");
export const AlignLeft = /* #__PURE__ */ icon(TextAlignLeftIcon, "AlignLeft");
export const AlignRight = /* #__PURE__ */ icon(TextAlignRightIcon, "AlignRight");
export const ArrowDownRight = /* #__PURE__ */ icon(ArrowDownRight02Icon, "ArrowDownRight");
export const ArrowRight = /* #__PURE__ */ icon(ArrowRight01Icon, "ArrowRight");
export const ArrowUpRight = /* #__PURE__ */ icon(ArrowUpRight01Icon, "ArrowUpRight");
export const BatteryMedium = /* #__PURE__ */ icon(BatteryMediumIcon, "BatteryMedium");
export const Bell = /* #__PURE__ */ icon(Notification01Icon, "Bell");
export const Bold = /* #__PURE__ */ icon(TextBoldIcon, "Bold");
export const Bug = /* #__PURE__ */ icon(BugIcon, "Bug");
export const Calendar = /* #__PURE__ */ icon(Calendar01Icon, "Calendar");
export const CalendarClock = /* #__PURE__ */ icon(CalendarSetting01Icon, "CalendarClock");
export const Check = /* #__PURE__ */ icon(Tick02Icon, "Check");
export const CheckCircle2 = /* #__PURE__ */ icon(CheckmarkCircle02Icon, "CheckCircle2");
export const CheckSquare = /* #__PURE__ */ icon(CheckmarkSquare02Icon, "CheckSquare");
export const ChevronDown = /* #__PURE__ */ icon(ArrowDown01Icon, "ChevronDown");
export const ChevronLeft = /* #__PURE__ */ icon(ArrowLeft01Icon, "ChevronLeft");
export const ChevronRight = /* #__PURE__ */ icon(ArrowRight01Icon, "ChevronRight");
export const ChevronUp = /* #__PURE__ */ icon(ArrowUp01Icon, "ChevronUp");
export const ChevronsLeft = /* #__PURE__ */ icon(ArrowLeftDoubleIcon, "ChevronsLeft");
export const ChevronsRight = /* #__PURE__ */ icon(ArrowRightDoubleIcon, "ChevronsRight");
export const Circle = /* #__PURE__ */ icon(CircleIcon, "Circle");
export const CircleDollarSign = /* #__PURE__ */ icon(DollarCircleIcon, "CircleDollarSign");
export const Clock = /* #__PURE__ */ icon(Clock01Icon, "Clock");
export const Component = /* #__PURE__ */ icon(ComponentIcon, "Component");
export const Copy = /* #__PURE__ */ icon(Copy01Icon, "Copy");
export const CornerDownLeft = /* #__PURE__ */ icon(ArrowTurnBackwardIcon, "CornerDownLeft");
export const Crown = /* #__PURE__ */ icon(CrownIcon, "Crown");
export const Download = /* #__PURE__ */ icon(Download01Icon, "Download");
export const FileCode = /* #__PURE__ */ icon(FileCodeIcon, "FileCode");
export const Filter = /* #__PURE__ */ icon(FilterIcon, "Filter");
export const Flag = /* #__PURE__ */ icon(Flag01Icon, "Flag");
export const FolderKanban = /* #__PURE__ */ icon(FolderManagementIcon, "FolderKanban");
export const FolderOpen = /* #__PURE__ */ icon(FolderOpenIcon, "FolderOpen");
export const GitCommitHorizontal = /* #__PURE__ */ icon(GitCommitIcon, "GitCommitHorizontal");
export const Github = /* #__PURE__ */ icon(GithubIcon, "Github");
export const Home = /* #__PURE__ */ icon(Home01Icon, "Home");
export const Info = /* #__PURE__ */ icon(InformationCircleIcon, "Info");
export const Italic = /* #__PURE__ */ icon(TextItalicIcon, "Italic");
export const Layers = /* #__PURE__ */ icon(Layers01Icon, "Layers");
export const LayoutDashboard = /* #__PURE__ */ icon(DashboardSquare01Icon, "LayoutDashboard");
export const LayoutGrid = /* #__PURE__ */ icon(GridViewIcon, "LayoutGrid");
export const PanelTop = /* #__PURE__ */ icon(SidebarTopIcon, "PanelTop");
export const LifeBuoy = /* #__PURE__ */ icon(LifebuoyIcon, "LifeBuoy");
export const Mail = /* #__PURE__ */ icon(Mail01Icon, "Mail");
export const MapPin = /* #__PURE__ */ icon(Location01Icon, "MapPin");
export const MessageCircle = /* #__PURE__ */ icon(BubbleChatIcon, "MessageCircle");
export const MessageSquare = /* #__PURE__ */ icon(Message01Icon, "MessageSquare");
export const MoreHorizontal = /* #__PURE__ */ icon(MoreHorizontalIcon, "MoreHorizontal");
export const Palette = /* #__PURE__ */ icon(PaintBoardIcon, "Palette");
export const Paperclip = /* #__PURE__ */ icon(Attachment01Icon, "Paperclip");
export const Pencil = /* #__PURE__ */ icon(PencilEdit01Icon, "Pencil");
export const Plus = /* #__PURE__ */ icon(PlusSignIcon, "Plus");
export const Receipt = /* #__PURE__ */ icon(Invoice01Icon, "Receipt");
export const Search = /* #__PURE__ */ icon(Search01Icon, "Search");
export const Save = /* #__PURE__ */ icon(FloppyDiskIcon, "Save");
export const Send = /* #__PURE__ */ icon(Sent02Icon, "Send");
export const ShoppingCart = /* #__PURE__ */ icon(ShoppingCart01Icon, "ShoppingCart");
export const Settings = /* #__PURE__ */ icon(Settings01Icon, "Settings");
export const Share2 = /* #__PURE__ */ icon(Share08Icon, "Share2");
export const PanelLeft = /* #__PURE__ */ icon(SidebarLeftIcon, "PanelLeft");
export const Signal = /* #__PURE__ */ icon(SignalIcon, "Signal");
export const Status = /* #__PURE__ */ icon(StatusIcon, "Status");
export const StickyNote = /* #__PURE__ */ icon(StickyNote01Icon, "StickyNote");
export const Trash2 = /* #__PURE__ */ icon(Delete02Icon, "Trash2");
export const TriangleAlert = /* #__PURE__ */ icon(Alert01Icon, "TriangleAlert");
export const Underline = /* #__PURE__ */ icon(TextUnderlineIcon, "Underline");
export const Upload = /* #__PURE__ */ icon(Upload01Icon, "Upload");
export const UserPlus = /* #__PURE__ */ icon(UserAdd01Icon, "UserPlus");
export const Users = /* #__PURE__ */ icon(UserMultipleIcon, "Users");
export const UsersRound = /* #__PURE__ */ icon(UserGroupIcon, "UsersRound");
export const Video = /* #__PURE__ */ icon(Video01Icon, "Video");
export const Wifi = /* #__PURE__ */ icon(Wifi01Icon, "Wifi");
export const X = /* #__PURE__ */ icon(Cancel01Icon, "X");
export const Zap = /* #__PURE__ */ icon(FlashIcon, "Zap");

// ---- earl-la-drevenne `app` additions (domain nav, chrome, forms) ----
export const AlertCircle = /* #__PURE__ */ icon(Alert02Icon, "AlertCircle");
export const ArrowDownUp = /* #__PURE__ */ icon(ArrowUpDownIcon, "ArrowDownUp");
export const ArrowLeft = /* #__PURE__ */ icon(ArrowLeft01Icon, "ArrowLeft");
export const Ban = /* #__PURE__ */ icon(CancelCircleIcon, "Ban");
export const Banknote = /* #__PURE__ */ icon(BankIcon, "Banknote");
export const ChefHat = /* #__PURE__ */ icon(ChefHatIcon, "ChefHat");
export const CreditCard = /* #__PURE__ */ icon(CreditCardIcon, "CreditCard");
export const Euro = /* #__PURE__ */ icon(EuroCircleIcon, "Euro");
export const ExternalLink = /* #__PURE__ */ icon(LinkSquare02Icon, "ExternalLink");
export const Link = /* #__PURE__ */ icon(LinkSquare02Icon, "Link");
export const Globe = /* #__PURE__ */ icon(GlobeIcon, "Globe");
export const HelpCircle = /* #__PURE__ */ icon(HelpCircleIcon, "HelpCircle");
export const Key = /* #__PURE__ */ icon(Key01Icon, "Key");
export const KeyRound = /* #__PURE__ */ icon(Key02Icon, "KeyRound");
export const Lock = /* #__PURE__ */ icon(LockIcon, "Lock");
export const Cloud = /* #__PURE__ */ icon(CloudIcon, "Cloud");
export const UploadCloud = /* #__PURE__ */ icon(CloudUploadIcon, "UploadCloud");
export const Database = /* #__PURE__ */ icon(Database01Icon, "Database");
export const Folder = /* #__PURE__ */ icon(Folder01Icon, "Folder");
export const HardDrive = /* #__PURE__ */ icon(HardDriveIcon, "HardDrive");
export const MonitorDown = /* #__PURE__ */ icon(ComputerArrowDownIcon, "MonitorDown");
export const FileSpreadsheet = /* #__PURE__ */ icon(Xls01Icon, "FileSpreadsheet");
export const Settings2 = /* #__PURE__ */ icon(Settings02Icon, "Settings2");
export const Edit = /* #__PURE__ */ icon(Edit01Icon, "Edit");
export const Play = /* #__PURE__ */ icon(PlayIcon, "Play");
export const Smartphone = /* #__PURE__ */ icon(SmartPhone01Icon, "Smartphone");
export const Shield = /* #__PURE__ */ icon(SecurityIcon, "Shield");
export const XCircle = /* #__PURE__ */ icon(CancelCircleIcon, "XCircle");
export const EyeOff = /* #__PURE__ */ icon(ViewOffSlashIcon, "EyeOff");
export const Tag = /* #__PURE__ */ icon(Tag01Icon, "Tag");
export const Eye = /* #__PURE__ */ icon(ViewIcon, "Eye");
export const FilePlus = /* #__PURE__ */ icon(FileAddIcon, "FilePlus");
export const History = /* #__PURE__ */ icon(HistoryIcon, "History");
export const ImagePlus = /* #__PURE__ */ icon(ImageAdd01Icon, "ImagePlus");
export const List = /* #__PURE__ */ icon(ListViewIcon, "List");
export const ListOrdered = /* #__PURE__ */ icon(LeftToRightListNumberIcon, "ListOrdered");
export const Minus = /* #__PURE__ */ icon(MinusSignIcon, "Minus");
export const PackageX = /* #__PURE__ */ icon(PackageRemoveIcon, "PackageX");
export const Percent = /* #__PURE__ */ icon(PercentIcon, "Percent");
export const Pin = /* #__PURE__ */ icon(PinIcon, "Pin");
export const Printer = /* #__PURE__ */ icon(PrinterIcon, "Printer");
export const RefreshCw = /* #__PURE__ */ icon(RefreshIcon, "RefreshCw");
export const ShieldCheck = /* #__PURE__ */ icon(CheckmarkBadge02Icon, "ShieldCheck");
export const Wallet = /* #__PURE__ */ icon(Wallet01Icon, "Wallet");
export const Box = /* #__PURE__ */ icon(BoxIcon, "Box");
export const Building2 = /* #__PURE__ */ icon(Building06Icon, "Building2");
export const ClipboardCheck = /* #__PURE__ */ icon(ClipboardCheckIcon, "ClipboardCheck");
export const ClipboardList = /* #__PURE__ */ icon(ClipboardListIcon, "ClipboardList");
export const ClipboardPen = /* #__PURE__ */ icon(ClipboardIcon, "ClipboardPen");
export const Contact = /* #__PURE__ */ icon(ContactIcon, "Contact");
export const DatabaseBackup = /* #__PURE__ */ icon(DatabaseBackupIcon, "DatabaseBackup");
export const FileText = /* #__PURE__ */ icon(Invoice01Icon, "FileText");
export const Languages = /* #__PURE__ */ icon(TranslateIcon, "Languages");
export const Loader2 = /* #__PURE__ */ icon(Loading03Icon, "Loader2");
export const LogOut = /* #__PURE__ */ icon(Logout01Icon, "LogOut");
export const Menu = /* #__PURE__ */ icon(Menu01Icon, "Menu");
export const Monitor = /* #__PURE__ */ icon(ComputerIcon, "Monitor");
export const Moon = /* #__PURE__ */ icon(Moon02Icon, "Moon");
export const Phone = /* #__PURE__ */ icon(Call02Icon, "Phone");
export const ScrollText = /* #__PURE__ */ icon(Task01Icon, "ScrollText");
export const Sun = /* #__PURE__ */ icon(Sun03Icon, "Sun");
export const User = /* #__PURE__ */ icon(UserIcon, "User");
