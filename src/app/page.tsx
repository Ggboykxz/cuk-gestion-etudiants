'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, GraduationCap, Trophy, FileText,
  Plus, Search, Edit3, Trash2, X, ChevronRight, Lock,
  AlertTriangle, CheckCircle2, Clock, XCircle, Eye,
  BookOpen, Calendar, Save, RefreshCw, Upload, FileUp,
  UserPlus, FolderOpen, Award, TrendingUp, BarChart3,
  Menu, ChevronDown, Filter, ArrowLeft, Medal, Shield,
  Printer, CheckCircle, AlertCircle, Info, Download,
  Bell, Command, Rows3, LayoutGrid, FileCheck, FileBadge,
  Baby, GraduationCapIcon, Image as ImageIcon, Sparkles, Hash, Type,
  Layers, Activity, Target, CircleDot, Calculator, ChevronUp,
  Grid3X3, List, FileSpreadsheet, BookMarked, PartyPopper,
  BadgeCheck, FolderCheck, ClipboardCheck, FileSearch
} from 'lucide-react'
import { toast } from 'sonner'

// ========================
// TYPES
// ========================
interface Student {
  id: string; matricule: string; nom: string; prenom: string
  dateNaissance?: string | null; lieuNaissance?: string | null
  sexe?: string | null; nationalite?: string | null; photo?: string | null
  telephone?: string | null; email?: string | null; adresse?: string | null
  nomPere?: string | null; nomMere?: string | null
  telephonePere?: string | null; telephoneMere?: string | null
  adresseParents?: string | null; personneContact?: string | null
  telephoneContact?: string | null; lienParente?: string | null
  etablissementOrigine?: string | null; diplomeOrigine?: string | null
  anneeObtentionDiplome?: string | null; bourse?: string | null; chambre?: string | null
  inscriptions?: Inscription[]; documents?: Document[]
  createdAt: string; updatedAt: string
}

interface Filiere {
  id: string; code: string; nom: string; description?: string | null
  niveau?: string | null; responsable?: string | null
  _count?: { promotions: number; matieres: number }
  createdAt: string; updatedAt: string
}

interface Promotion {
  id: string; filiereId: string; anneeScolaire: string; niveau: string
  statut: string; dateCloture?: string | null
  filiere?: Filiere; inscriptions?: Inscription[]; matieres?: Matiere[]
  _count?: { inscriptions: number; matieres: number }
  createdAt: string; updatedAt: string
}

interface Inscription {
  id: string; studentId: string; promotionId: string
  numeroDossier?: string | null; statutDossier?: string | null
  statut?: string | null; redoublant: boolean
  student?: Student; promotion?: Promotion; notes?: Note[]
  createdAt: string; updatedAt: string
}

interface Matiere {
  id: string; code: string; nom: string; coefficient: number
  semestre: number; filiereId: string; promotionId?: string | null
  filiere?: Filiere; promotion?: Promotion
  _count?: { notes: number }
  notes?: Note[]
  createdAt: string; updatedAt: string
}

interface Note {
  id: string; inscriptionId: string; matiereId: string
  noteCC?: number | null; noteExam?: number | null; noteTP?: number | null
  moyenne?: number | null; observation?: string | null
  inscription?: Inscription; matiere?: Matiere
  createdAt: string; updatedAt: string
}

interface Document {
  id: string; titre: string; type: string; fichier: string
  tailleFichier?: string | null; etudiantId: string
  student?: { id: string; nom: string; prenom: string; matricule: string }
  createdAt: string; updatedAt: string
}

interface ActivityItem {
  type: 'inscription' | 'student' | 'promotion' | 'note'
  message: string
  date: string
  icon: string
}

interface Stats {
  totalStudents: number; totalPromotions: number
  activePromotions: number; closedPromotions: number
  totalInscriptions: number; totalFilieres: number
  dossierByStatus: { statut: string; count: number }[]
  filiereCounts: Record<string, number>
  recentInscriptions: Inscription[]
  tauxReussite: number
  tauxReussiteAcademic: number
  activityFeed: ActivityItem[]
  dossierCompleteness: number
  gradeEntryProgress: { promotionId: string; filiereNom: string; niveau: string; anneeScolaire: string; totalNeeded: number; totalEntered: number; progress: number }[]
}

interface PalmaresData {
  promotion: { id: string; anneeScolaire: string; niveau: string; statut: string; dateCloture?: string | null; filiere: Filiere }
  palmares: PalmaresEntry[]
  statistics: { classAvg: number; passRate: number; totalStudents: number; mentionDistribution: Record<string, number> }
}

interface PalmaresEntry {
  inscriptionId: string; studentId: string; matricule: string
  nom: string; prenom: string; redoublant: boolean
  rang: number; moyenneS1: number | null; moyenneS2: number | null
  moyenneAnnuelle: number | null; totalCredits: number; mention: string
  notes: { matiereId: string; matiereNom: string; matiereCode: string; coefficient: number; semestre: number; noteCC: number | null; noteExam: number | null; noteTP: number | null; moyenne: number | null }[]
}

// ========================
// HELPERS
// ========================
const FILIERE_COLORS: Record<string, string> = {}
const colorPalette = ['#00ff88', '#00d4ff', '#ff6b6b', '#ffd93d', '#c084fc', '#ff8855', '#44ddff', '#ff66aa', '#88ff44', '#ffaa44']

const getFiliereColor = (code: string) => {
  if (!FILIERE_COLORS[code]) {
    FILIERE_COLORS[code] = colorPalette[Object.keys(FILIERE_COLORS).length % colorPalette.length]
  }
  return FILIERE_COLORS[code]
}

const dossierBadge = (statut: string | null | undefined) => {
  const s = statut || 'Incomplet'
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'Complet': { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', icon: <CheckCircle2 className="w-3 h-3" /> },
    'Incomplet': { bg: 'bg-orange-500/15 border-orange-500/30', text: 'text-orange-400', icon: <AlertTriangle className="w-3 h-3" /> },
    'En attente': { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', icon: <Clock className="w-3 h-3" /> },
    'Validé': { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400', icon: <CheckCircle className="w-3 h-3" /> },
    'Rejeté': { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', icon: <XCircle className="w-3 h-3" /> },
  }
  const style = map[s] || map['Incomplet']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border ${style.bg} ${style.text}`}>
      {style.icon} {s}
    </span>
  )
}

const mentionBadge = (mention: string) => {
  const map: Record<string, { bg: string; text: string }> = {
    'Très Bien': { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400' },
    'Bien': { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400' },
    'Assez Bien': { bg: 'bg-cyan-500/15 border-cyan-500/30', text: 'text-cyan-400' },
    'Passable': { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400' },
    'Ajourné': { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400' },
  }
  const style = map[mention] || { bg: 'bg-gray-500/15 border-gray-500/30', text: 'text-gray-400' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono border ${style.bg} ${style.text}`}>
      {mention}
    </span>
  )
}

const niveauOrder = ['L1', 'L2', 'L3', 'M1', 'M2']

const getDocTypeIcon = (type: string) => {
  switch (type) {
    case 'Acte de naissance': return <Baby className="w-4 h-4" />
    case 'Relevé de notes': return <FileSpreadsheet className="w-4 h-4" />
    case 'Diplôme': return <GraduationCap className="w-4 h-4" />
    case 'Certificat': return <FileBadge className="w-4 h-4" />
    case 'Photo': return <ImageIcon className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

const formatDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return d }
}

// ========================
// ANIMATED COUNTER
// ========================
function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef<number | null>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = null
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  return <>{display}</>
}

// ========================
// CIRCULAR PROGRESS
// ========================
function CircularProgress({ value, size = 80, strokeWidth = 6, color = '#00ff88' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-[#e0e0e6] font-mono font-bold" style={{ fontSize: size * 0.22, transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {value}%
      </text>
    </svg>
  )
}

// ========================
// SKELETON LOADING
// ========================
function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] animate-pulse">
      <div className="h-3 bg-[#1a1a2e] rounded w-1/2 mb-3" />
      <div className="h-6 bg-[#1a1a2e] rounded w-1/3 mb-2" />
      <div className="h-2 bg-[#1a1a2e] rounded w-2/3" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex gap-4 p-3 animate-pulse">
      <div className="h-3 bg-[#1a1a2e] rounded w-20" />
      <div className="h-3 bg-[#1a1a2e] rounded w-32" />
      <div className="h-3 bg-[#1a1a2e] rounded w-24" />
      <div className="h-3 bg-[#1a1a2e] rounded w-16" />
    </div>
  )
}

// ========================
// API HELPERS
// ========================
const api = {
  get: async (url: string) => { const r = await fetch(url); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Erreur'); return r.json() },
  post: async (url: string, data?: unknown) => { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Erreur'); return r.json() },
  put: async (url: string, data: unknown) => { const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Erreur'); return r.json() },
  del: async (url: string) => { const r = await fetch(url, { method: 'DELETE' }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Erreur'); return r.json() },
}

// ========================
// MAIN COMPONENT
// ========================
export default function CUKApp() {
  const [view, setView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Data
  const [students, setStudents] = useState<Student[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)

  // Detail views
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [palmaresData, setPalmaresData] = useState<PalmaresData | null>(null)

  // Dialogs
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showFiliereForm, setShowFiliereForm] = useState(false)
  const [showPromotionForm, setShowPromotionForm] = useState(false)
  const [showInscriptionForm, setShowInscriptionForm] = useState(false)
  const [showMatiereForm, setShowMatiereForm] = useState(false)
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [showClotureConfirm, setShowClotureConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null)
  const [showInscriptionDetail, setShowInscriptionDetail] = useState<Inscription | null>(null)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  // Editing
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null)
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null)
  const [selectedMatiereForNotes, setSelectedMatiereForNotes] = useState<Matiere | null>(null)

  // Search & filters
  const [studentSearch, setStudentSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [promoFilterAnnee, setPromoFilterAnnee] = useState('')
  const [promoFilterFiliere, setPromoFilterFiliere] = useState('')
  const [promoFilterStatut, setPromoFilterStatut] = useState('')
  const [palmaresPromotionId, setPalmaresPromotionId] = useState('')
  const [docFilterStudent, setDocFilterStudent] = useState('')
  const [docFilterType, setDocFilterType] = useState('')

  // New state
  const [studentViewMode, setStudentViewMode] = useState<'grid' | 'list'>('grid')
  const [studentGenderFilter, setStudentGenderFilter] = useState('')
  const [studentPage, setStudentPage] = useState(1)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('')
  const [promoTab, setPromoTab] = useState('resume')
  const [palmaresSemester, setPalmaresSemester] = useState<'S1' | 'S2' | 'annual'>('annual')
  const [expandedPalmaresRow, setExpandedPalmaresRow] = useState<string | null>(null)
  const [commandSearch, setCommandSearch] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(studentSearch), 300)
    return () => clearTimeout(timer)
  }, [studentSearch])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowStudentForm(false); setShowFiliereForm(false); setShowPromotionForm(false)
        setShowInscriptionForm(false); setShowMatiereForm(false); setShowDocumentForm(false)
        setShowCommandPalette(false); setShowClotureConfirm(false); setShowDeleteConfirm(null)
        setEditingStudent(null); setEditingMatiere(null); setEditingFiliere(null)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); setShowCommandPalette(true); setCommandSearch('')
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault(); setShowStudentForm(true); setEditingStudent(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [s, f, p, st] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/filieres'),
        api.get('/api/promotions'),
        api.get('/api/stats'),
      ])
      setStudents(s)
      setFilieres(f)
      setPromotions(p)
      setStats(st)
    } catch (e) { console.error(e); toast.error('Erreur de chargement') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const refreshPromotions = async () => { try { setPromotions(await api.get('/api/promotions')) } catch { /* */ } }
  const refreshStudents = async () => { try { setStudents(await api.get('/api/students')) } catch { /* */ } }
  const refreshStats = async () => { try { setStats(await api.get('/api/stats')) } catch { /* */ } }
  const refreshSelectedPromotion = async () => { if (selectedPromotion) try { setSelectedPromotion(await api.get(`/api/promotions/${selectedPromotion.id}`)) } catch { /* */ } }
  const refreshSelectedStudent = async () => { if (selectedStudent) try { setSelectedStudent(await api.get(`/api/students/${selectedStudent.id}`)) } catch { /* */ } }
  const loadPalmares = async (pid: string) => { try { setPalmaresData(await api.get(`/api/palmares?promotionId=${pid}`)) } catch { toast.error('Erreur de chargement du palmarès') } }

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'students', label: 'Étudiants', icon: Users },
    { key: 'promotions', label: 'Promotions', icon: GraduationCap },
    { key: 'filieres', label: 'Filières', icon: BookOpen },
    { key: 'palmares', label: 'Palmarès', icon: Trophy },
    { key: 'documents', label: 'Documents', icon: FileText },
  ]

  const navigateTo = (key: string) => { setView(key); setSelectedStudent(null); setSelectedPromotion(null); setMobileMenuOpen(false) }
  const years = Array.from(new Set(promotions.map(p => p.anneeScolaire))).sort().reverse()
  const docTypes = ['Acte de naissance', 'Relevé de notes', 'Diplôme', 'Certificat', 'Photo', 'Autre']

  // Notification count
  const notificationCount = useMemo(() => {
    if (!stats) return 0
    let count = 0
    count += stats.dossierByStatus.filter(d => d.statut === 'Incomplet').reduce((s, d) => s + d.count, 0)
    count += stats.gradeEntryProgress.filter(g => g.progress < 100).length
    return count
  }, [stats])

  // ========================
  // SIDEBAR
  // ========================
  const Sidebar = () => (
    <aside className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0d0d14] transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex items-center gap-3 p-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-[#00ff88]" />
        </div>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="text-sm font-bold gradient-text tracking-wider">CUK</h1>
            <p className="text-[10px] text-[#6b6b8a]">Koulamoutou</p>
          </motion.div>
        )}
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.key} onClick={() => navigateTo(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-200 focus-ring ${view === item.key ? 'bg-[#00ff88]/10 text-[#00ff88] sidebar-active' : 'text-[#6b6b8a] hover:text-[#e0e0e6] hover:bg-[#1a1a2e] border-l-[3px] border-transparent'}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
        {sidebarOpen && (
          <div className="text-[10px] text-[#6b6b8a] font-mono">
            <p>v3.0 — Gestion Étudiants</p>
            <p>© CUK 2025</p>
          </div>
        )}
      </div>
    </aside>
  )

  // ========================
  // TOP BAR
  // ========================
  const TopBar = () => (
    <header className="h-14 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-4 glassmorphism sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-[#6b6b8a] hover:text-[#00ff88] focus-ring rounded">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-[#6b6b8a] hover:text-[#00ff88] focus-ring rounded">
          <Menu className="w-5 h-5" />
        </button>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#6b6b8a]">
          <span className="text-[#00ff88]">$</span>
          <span>cuk</span>
          <span className="text-[#6b6b8a]">/</span>
          <span className="text-[#e0e0e6]">{navItems.find(n => n.key === view)?.label || 'Dashboard'}</span>
          {selectedStudent && <><span className="text-[#6b6b8a]">/</span><span className="text-[#00d4ff]">{selectedStudent.nom}</span></>}
          {selectedPromotion && <><span className="text-[#6b6b8a]">/</span><span className="text-[#00d4ff]">{selectedPromotion.filiere?.nom} {selectedPromotion.niveau}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Command Palette trigger */}
        <button onClick={() => { setShowCommandPalette(true); setCommandSearch('') }} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] text-xs font-mono text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">
          <Search className="w-3 h-3" />
          <span className="hidden md:inline">Rechercher...</span>
          <kbd className="hidden md:inline px-1.5 py-0.5 rounded bg-[#0a0a0f] text-[10px] border border-[rgba(255,255,255,0.1)]">⌘K</kbd>
        </button>
        {/* Notification bell */}
        <button className="relative p-1.5 rounded-lg text-[#6b6b8a] hover:text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors focus-ring" onClick={() => navigateTo('documents')}>
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ff4444] text-[9px] text-white flex items-center justify-center font-bold">{notificationCount > 9 ? '9+' : notificationCount}</span>
          )}
        </button>
        <button onClick={() => { fetchData(); toast.success('Données actualisées') }} className="p-1.5 rounded-lg text-[#6b6b8a] hover:text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors focus-ring">
          <RefreshCw className="w-4 h-4" />
        </button>
        {/* Academic year selector */}
        <select value={selectedAcademicYear} onChange={e => setSelectedAcademicYear(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] text-xs font-mono text-[#6b6b8a] focus-ring terminal-input">
          <option value="">Toutes les années</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </header>
  )

  // ========================
  // COMMAND PALETTE
  // ========================
  const CommandPalette = () => {
    const results = useMemo(() => {
      if (!commandSearch.trim()) return []
      const q = commandSearch.toLowerCase()
      const items: { type: string; label: string; action: () => void; icon: React.ElementType }[] = []
      students.filter(s => `${s.nom} ${s.prenom} ${s.matricule}`.toLowerCase().includes(q)).slice(0, 5).forEach(s => {
        items.push({ type: 'Étudiant', label: `${s.nom} ${s.prenom} (${s.matricule})`, action: () => { setSelectedStudent(s); setView('students') }, icon: Users })
      })
      promotions.filter(p => `${p.filiere?.nom} ${p.niveau} ${p.anneeScolaire}`.toLowerCase().includes(q)).slice(0, 5).forEach(p => {
        items.push({ type: 'Promotion', label: `${p.filiere?.nom} ${p.niveau} (${p.anneeScolaire})`, action: () => { setSelectedPromotion(p); setView('promotions') }, icon: GraduationCap })
      })
      filieres.filter(f => `${f.nom} ${f.code}`.toLowerCase().includes(q)).slice(0, 5).forEach(f => {
        items.push({ type: 'Filière', label: `${f.nom} (${f.code})`, action: () => setView('filieres'), icon: BookOpen })
      })
      items.push({ type: 'Action', label: 'Nouvel étudiant', action: () => { setShowStudentForm(true); setEditingStudent(null) }, icon: UserPlus })
      items.push({ type: 'Action', label: 'Nouvelle promotion', action: () => { setShowPromotionForm(true) }, icon: Plus })
      items.push({ type: 'Vue', label: 'Dashboard', action: () => navigateTo('dashboard'), icon: LayoutDashboard })
      items.push({ type: 'Vue', label: 'Étudiants', action: () => navigateTo('students'), icon: Users })
      items.push({ type: 'Vue', label: 'Promotions', action: () => navigateTo('promotions'), icon: GraduationCap })
      items.push({ type: 'Vue', label: 'Palmarès', action: () => navigateTo('palmares'), icon: Trophy })
      return items
    }, [commandSearch, students, promotions, filieres])

    return (
      <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] p-4" onClick={() => setShowCommandPalette(false)}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 p-4 border-b border-[rgba(255,255,255,0.06)]">
            <Search className="w-4 h-4 text-[#6b6b8a]" />
            <input value={commandSearch} onChange={e => setCommandSearch(e.target.value)} placeholder="Rechercher étudiants, promotions, filières..." autoFocus className="flex-1 bg-transparent text-sm font-mono text-[#e0e0e6] outline-none placeholder-[#6b6b8a]" />
            <kbd className="px-2 py-0.5 rounded bg-[#1a1a2e] text-[10px] font-mono text-[#6b6b8a] border border-[rgba(255,255,255,0.06)]">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-xs font-mono text-[#6b6b8a] text-center py-8">Tapez pour rechercher...</p>
            ) : (
              results.map((item, i) => (
                <button key={i} onClick={() => { item.action(); setShowCommandPalette(false) }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#1a1a2e] transition-colors focus-ring">
                  <item.icon className="w-4 h-4 text-[#6b6b8a] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-[#e0e0e6] truncate">{item.label}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#6b6b8a] px-2 py-0.5 rounded bg-[#0a0a0f]">{item.type}</span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // ========================
  // STAT CARD
  // ========================
  const StatCard = ({ icon: Icon, label, value, color, sub, animate = true }: { icon: React.ElementType; label: string; value: number | string; color: string; sub?: string; animate?: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,255,136,0.2)] transition-all duration-300 stat-glow group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-[#6b6b8a] mb-1">{label}</p>
          <p className={`text-2xl font-bold font-mono ${color}`}>
            {animate && typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
          {sub && <p className="text-[10px] font-mono text-[#6b6b8a] mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${color === 'text-[#00ff88]' ? 'bg-[#00ff88]/10' : color === 'text-[#00d4ff]' ? 'bg-[#00d4ff]/10' : color === 'text-[#ffaa00]' ? 'bg-[#ffaa00]/10' : color === 'text-[#c084fc]' ? 'bg-[#c084fc]/10' : 'bg-[#ff4444]/10'}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </motion.div>
  )

  // ========================
  // DIALOG OVERLAY
  // ========================
  const DialogOverlay = ({ onClose, title, children, wide }: { onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} p-6 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono font-bold text-[#00ff88]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  )

  // ========================
  // DASHBOARD VIEW
  // ========================
  const DashboardView = () => {
    if (loading) return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    )
    if (!stats) return <div className="flex items-center justify-center h-64 text-[#6b6b8a] font-mono text-sm">Chargement...</div>

    const dossierStats = stats.dossierByStatus.length > 0 ? stats.dossierByStatus : [
      { statut: 'Complet', count: 0 }, { statut: 'Incomplet', count: 0 },
      { statut: 'En attente', count: 0 }, { statut: 'Validé', count: 0 }, { statut: 'Rejeté', count: 0 },
    ]

    const activityIcons: Record<string, React.ElementType> = { 'user-plus': UserPlus, 'user': Users, 'graduation': GraduationCap, 'note': BookOpen }

    return (
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="p-6 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] dot-grid-bg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-mono text-[#6b6b8a] mb-1">{getGreeting()},</p>
            <h2 className="text-2xl md:text-3xl font-bold font-mono text-[#e0e0e6] animate-hero-glow">
              Bienvenue au Centre Universitaire de Koulamoutou
            </h2>
            <p className="text-xs font-mono text-[#6b6b8a] mt-2">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5">
            <GraduationCap className="w-40 h-40 text-[#00ff88]" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Étudiants inscrits" value={stats.totalStudents} color="text-[#00ff88]" sub={`${stats.totalInscriptions} inscriptions`} />
          <StatCard icon={GraduationCap} label="Promotions actives" value={stats.activePromotions} color="text-[#00d4ff]" sub={`${stats.closedPromotions} clôturées`} />
          <StatCard icon={FolderOpen} label="Dossiers complets" value={stats.dossierByStatus.find(d => d.statut === 'Complet')?.count || 0} color="text-[#ffaa00]" sub={`${stats.dossierCompleteness}% complétude`} />
          <StatCard icon={TrendingUp} label="Taux de réussite" value={stats.tauxReussiteAcademic || stats.tauxReussite} color="text-[#c084fc]" sub="moyenne ≥ 10" />
        </div>

        {/* Taux de réussite + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Circular progress */}
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] flex flex-col items-center justify-center">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-[#00ff88]" /> Taux de réussite</h3>
            <CircularProgress value={stats.tauxReussiteAcademic || stats.tauxReussite} size={120} strokeWidth={8} color="#00ff88" />
            <p className="text-[10px] font-mono text-[#6b6b8a] mt-3">Étudiants avec moyenne ≥ 10</p>
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-[#00d4ff]" /> Activité récente</h3>
            {stats.activityFeed.length === 0 ? (
              <p className="text-xs font-mono text-[#6b6b8a] text-center py-4">Aucune activité</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {stats.activityFeed.slice(0, 5).map((act, i) => {
                  const Ic = activityIcons[act.icon] || Info
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                        <Ic className="w-3.5 h-3.5 text-[#00ff88]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-[#e0e0e6] truncate">{act.message}</p>
                        <p className="text-[10px] font-mono text-[#6b6b8a]">{formatDate(act.date)}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Filiere Distribution Chart */}
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00d4ff]" /> Répartition par filière</h3>
            {Object.keys(stats.filiereCounts).length === 0 ? (
              <p className="text-xs font-mono text-[#6b6b8a]">Aucune inscription</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.filiereCounts).map(([name, count], i) => {
                  const maxCount = Math.max(...Object.values(stats.filiereCounts), 1)
                  const pct = (count / maxCount) * 100
                  const c = colorPalette[i % colorPalette.length]
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-[#6b6b8a] truncate max-w-[60%]">{name}</span>
                        <span className="text-[#e0e0e6]">{count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-[#1a1a2e] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${c}66, ${c})` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Dossier Status Chart */}
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00d4ff]" /> Statut des dossiers</h3>
            <div className="space-y-3">
              {dossierStats.map(d => {
                const maxCount = Math.max(...dossierStats.map(x => x.count), 1)
                const pct = (d.count / maxCount) * 100
                const colors: Record<string, string> = { 'Complet': '#00ff88', 'Incomplet': '#ff8800', 'En attente': '#ffaa00', 'Validé': '#00d4ff', 'Rejeté': '#ff4444', 'Non défini': '#6b6b8a' }
                const c = colors[d.statut] || '#6b6b8a'
                return (
                  <div key={d.statut}>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-[#6b6b8a]">{d.statut}</span>
                      <span className="text-[#e0e0e6]">{d.count}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${c}88, ${c})` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Grade Entry Progress */}
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-[#ffaa00]" /> Saisie des notes</h3>
            {stats.gradeEntryProgress.length === 0 ? (
              <p className="text-xs font-mono text-[#6b6b8a]">Aucune promotion active</p>
            ) : (
              <div className="space-y-3">
                {stats.gradeEntryProgress.map(g => (
                  <div key={g.promotionId}>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-[#6b6b8a]">{g.filiereNom} {g.niveau}</span>
                      <span className="text-[#e0e0e6]">{g.totalEntered}/{g.totalNeeded}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${g.progress}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${g.progress >= 80 ? '#00ff88' : g.progress >= 50 ? '#ffaa00' : '#ff4444'}88, ${g.progress >= 80 ? '#00ff88' : g.progress >= 50 ? '#ffaa00' : '#ff4444'})` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Inscriptions */}
        <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-[#e0e0e6] flex items-center gap-2"><Clock className="w-4 h-4 text-[#ffaa00]" /> Inscriptions récentes</h3>
            <div className="flex gap-2">
              <button onClick={() => { setShowPromotionForm(true) }} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
                <Plus className="w-3 h-3" /> Promotion
              </button>
              <button onClick={() => { setShowStudentForm(true); setEditingStudent(null) }} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 animate-pulse-btn btn-micro focus-ring">
                <Plus className="w-3 h-3" /> Étudiant
              </button>
            </div>
          </div>
          {stats.recentInscriptions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-xs font-mono text-[#6b6b8a]">Aucune inscription pour le moment</p>
              <p className="text-[10px] font-mono text-[#6b6b8a] mt-1">Commencez par créer une promotion et inscrire des étudiants</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
                  <th className="py-2 px-3 text-left">Matricule</th><th className="py-2 px-3 text-left">Nom</th><th className="py-2 px-3 text-left">Promotion</th><th className="py-2 px-3 text-left">Dossier</th>
                </tr></thead>
                <tbody>
                  {stats.recentInscriptions.slice(0, 8).map(ins => (
                    <tr key={ins.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1a1a2e]/50 transition-colors">
                      <td className="py-2 px-3 text-[#00ff88]">{ins.student?.matricule}</td>
                      <td className="py-2 px-3 text-[#e0e0e6]">{ins.student?.nom} {ins.student?.prenom}</td>
                      <td className="py-2 px-3 text-[#e0e0e6]">{ins.promotion?.filiere?.nom} {ins.promotion?.niveau}</td>
                      <td className="py-2 px-3">{dossierBadge(ins.statutDossier)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========================
  // STUDENTS VIEW
  // ========================
  const StudentsView = () => {
    const filtered = students.filter(s => {
      if (debouncedSearch && !`${s.matricule} ${s.nom} ${s.prenom}`.toLowerCase().includes(debouncedSearch.toLowerCase())) return false
      if (studentGenderFilter && s.sexe !== studentGenderFilter) return false
      return true
    })

    const ITEMS_PER_PAGE = 10
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const paged = filtered.slice((studentPage - 1) * ITEMS_PER_PAGE, studentPage * ITEMS_PER_PAGE)

    if (selectedStudent) return <StudentDetailView />

    const StudentAvatar = ({ s, size = 'sm' }: { s: Student; size?: 'sm' | 'md' | 'lg' }) => {
      const sz = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
      return s.photo ? (
        <img src={s.photo} alt={`${s.prenom} ${s.nom}`} className={`${sz} rounded-full object-cover flex-shrink-0 border border-[rgba(255,255,255,0.1)]`} />
      ) : (
        <div className={`${sz} rounded-full bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] font-mono font-bold flex-shrink-0`}>
          {s.prenom[0]}{s.nom[0]}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b8a]" />
              <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setStudentPage(1) }} placeholder="Rechercher un étudiant..." className="w-full pl-10 pr-4 py-2 rounded-lg terminal-input text-sm font-mono text-[#e0e0e6] bg-[#12121a] focus-ring" />
            </div>
            <select value={studentGenderFilter} onChange={e => { setStudentGenderFilter(e.target.value); setStudentPage(1) }} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="">Tous les sexes</option>
              <option value="Masculin">Masculin</option>
              <option value="Féminin">Féminin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden">
              <button onClick={() => setStudentViewMode('grid')} className={`p-2 focus-ring ${studentViewMode === 'grid' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'text-[#6b6b8a] hover:text-[#e0e0e6]'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setStudentViewMode('list')} className={`p-2 focus-ring ${studentViewMode === 'list' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'text-[#6b6b8a] hover:text-[#e0e0e6]'}`}><List className="w-4 h-4" /></button>
            </div>
            <button onClick={() => toast.info('Fonctionnalité à venir')} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#1a1a2e] text-[#6b6b8a] border border-[rgba(255,255,255,0.06)] hover:text-[#e0e0e6] transition-colors flex items-center gap-1 btn-micro focus-ring">
              <Download className="w-3 h-3" /> Exporter
            </button>
            <button onClick={() => { setShowStudentForm(true); setEditingStudent(null) }} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-2 animate-pulse-btn btn-micro focus-ring">
              <Plus className="w-4 h-4" /> Nouvel étudiant
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-sm font-mono text-[#6b6b8a]">Aucun étudiant trouvé</p>
            <p className="text-[10px] font-mono text-[#6b6b8a] mt-1">Ajoutez votre premier étudiant pour commencer</p>
            <button onClick={() => { setShowStudentForm(true); setEditingStudent(null) }} className="mt-4 px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors btn-micro focus-ring">
              <Plus className="w-3 h-3 inline mr-1" /> Ajouter un étudiant
            </button>
          </div>
        ) : studentViewMode === 'list' ? (
          /* List / Table View */
          <div className="rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)] bg-[#0d0d14]">
                  <th className="py-2.5 px-3 text-left">Photo</th>
                  <th className="py-2.5 px-3 text-left">Matricule</th>
                  <th className="py-2.5 px-3 text-left">Nom</th>
                  <th className="py-2.5 px-3 text-left">Prénom</th>
                  <th className="py-2.5 px-3 text-left">Filière actuelle</th>
                  <th className="py-2.5 px-3 text-left">Niveau</th>
                  <th className="py-2.5 px-3 text-left">Dossier</th>
                </tr></thead>
                <tbody>
                  {paged.map((student, i) => {
                    const currentIns = student.inscriptions?.[0]
                    return (
                      <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1a1a2e]/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedStudent(student)}>
                        <td className="py-2 px-3"><StudentAvatar s={student} /></td>
                        <td className="py-2 px-3 text-[#00ff88]">{student.matricule}</td>
                        <td className="py-2 px-3 text-[#e0e0e6]">{student.nom}</td>
                        <td className="py-2 px-3 text-[#e0e0e6]">{student.prenom}</td>
                        <td className="py-2 px-3 text-[#e0e0e6]">{currentIns?.promotion?.filiere?.code || '—'}</td>
                        <td className="py-2 px-3">{currentIns?.promotion?.niveau ? <span className="px-2 py-0.5 rounded text-[10px] bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">{currentIns.promotion.niveau}</span> : '—'}</td>
                        <td className="py-2 px-3">{currentIns ? dossierBadge(currentIns.statutDossier) : '—'}</td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-[rgba(255,255,255,0.06)]">
                <p className="text-[10px] font-mono text-[#6b6b8a]">{filtered.length} étudiants — Page {studentPage}/{totalPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setStudentPage(Math.max(1, studentPage - 1))} disabled={studentPage === 1} className="px-2 py-1 text-[10px] font-mono rounded bg-[#1a1a2e] text-[#6b6b8a] hover:text-[#e0e0e6] disabled:opacity-30 focus-ring">← Préc</button>
                  <button onClick={() => setStudentPage(Math.min(totalPages, studentPage + 1))} disabled={studentPage === totalPages} className="px-2 py-1 text-[10px] font-mono rounded bg-[#1a1a2e] text-[#6b6b8a] hover:text-[#e0e0e6] disabled:opacity-30 focus-ring">Suiv →</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paged.map((student, i) => {
                const currentIns = student.inscriptions?.[0]
                return (
                  <motion.div key={student.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,255,136,0.2)] cursor-pointer transition-all duration-300 group btn-micro" onClick={() => setSelectedStudent(student)}>
                    <div className="flex items-center gap-3">
                      <StudentAvatar s={student} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono text-[#e0e0e6] truncate group-hover:text-[#00ff88] transition-colors">{student.nom} {student.prenom}</p>
                        <p className="text-xs font-mono text-[#6b6b8a]">{student.matricule}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6b6b8a] ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                    {currentIns && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20">{currentIns.promotion?.filiere?.code} {currentIns.promotion?.niveau}</span>
                        {dossierBadge(currentIns.statutDossier)}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-[10px] font-mono text-[#6b6b8a]">{filtered.length} étudiants — Page {studentPage}/{totalPages}</p>
                <div className="flex gap-1">
                  <button onClick={() => setStudentPage(Math.max(1, studentPage - 1))} disabled={studentPage === 1} className="px-3 py-1.5 text-[10px] font-mono rounded-lg bg-[#1a1a2e] text-[#6b6b8a] hover:text-[#e0e0e6] disabled:opacity-30 focus-ring">← Préc</button>
                  <button onClick={() => setStudentPage(Math.min(totalPages, studentPage + 1))} disabled={studentPage === totalPages} className="px-3 py-1.5 text-[10px] font-mono rounded-lg bg-[#1a1a2e] text-[#6b6b8a] hover:text-[#e0e0e6] disabled:opacity-30 focus-ring">Suiv →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ========================
  // STUDENT DETAIL VIEW
  // ========================
  const StudentDetailView = () => {
    if (!selectedStudent) return null
    const s = selectedStudent

    const calcInscriptionAvg = (ins: Inscription) => {
      if (!ins.notes || ins.notes.length === 0) return null
      let tw = 0, tc = 0
      for (const n of ins.notes) {
        if (n.moyenne !== null && n.moyenne !== undefined) {
          tw += n.moyenne * (n.matiere?.coefficient || 1)
          tc += n.matiere?.coefficient || 1
        }
      }
      return tc > 0 ? Math.round((tw / tc) * 100) / 100 : null
    }

    const getMentionFromAvg = (avg: number) => {
      if (avg >= 16) return 'Très Bien'
      if (avg >= 14) return 'Bien'
      if (avg >= 12) return 'Assez Bien'
      if (avg >= 10) return 'Passable'
      return 'Ajourné'
    }

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-xs font-mono text-[#6b6b8a] hover:text-[#00ff88] transition-colors focus-ring">
          <ArrowLeft className="w-4 h-4" /> Retour aux étudiants
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Student Info */}
          <div className="lg:col-span-1 p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] space-y-4">
            <div className="flex items-center gap-3">
              {s.photo ? (
                <img src={s.photo} alt={`${s.prenom} ${s.nom}`} className="w-14 h-14 rounded-full object-cover border border-[rgba(255,255,255,0.1)]" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] font-mono text-xl font-bold">
                  {s.prenom[0]}{s.nom[0]}
                </div>
              )}
              <div>
                <h2 className="text-lg font-mono font-bold text-[#e0e0e6]">{s.nom} {s.prenom}</h2>
                <p className="text-xs font-mono text-[#00ff88]">{s.matricule}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs font-mono">
              {[
                ['Date de naissance', s.dateNaissance], ['Lieu', s.lieuNaissance], ['Sexe', s.sexe], ['Nationalité', s.nationalite],
                ['Téléphone', s.telephone], ['Email', s.email], ['Adresse', s.adresse],
                ['Père', s.nomPere], ['Mère', s.nomMere], ['Établissement', s.etablissementOrigine], ['Diplôme', s.diplomeOrigine],
                ['Bourse', s.bourse], ['Chambre', s.chambre],
              ].map(([l, v]) => v ? (
                <div key={l} className="flex justify-between">
                  <span className="text-[#6b6b8a]">{l}</span>
                  <span className="text-[#e0e0e6] text-right max-w-[60%] truncate" title={v}>{v}</span>
                </div>
              ) : null)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingStudent(s); setShowStudentForm(true) }} className="flex-1 px-3 py-2 text-xs font-mono rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-colors flex items-center justify-center gap-1 btn-micro focus-ring">
                <Edit3 className="w-3 h-3" /> Modifier
              </button>
              <button onClick={() => setShowDeleteConfirm({ type: 'student', id: s.id, name: `${s.nom} ${s.prenom}` })} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center justify-center gap-1 btn-micro focus-ring">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Academic Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-[#00d4ff]" /> Parcours académique</h3>
              {(!s.inscriptions || s.inscriptions.length === 0) ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">📚</div>
                  <p className="text-xs font-mono text-[#6b6b8a]">Aucune inscription</p>
                  <p className="text-[10px] font-mono text-[#6b6b8a]">Inscrivez cet étudiant dans une promotion</p>
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-[rgba(0,255,136,0.2)]" />
                  {s.inscriptions.sort((a, b) => {
                    const ya = a.promotion?.anneeScolaire || ''; const yb = b.promotion?.anneeScolaire || ''
                    return yb.localeCompare(ya)
                  }).map(ins => {
                    const avg = calcInscriptionAvg(ins)
                    const mention = avg !== null ? getMentionFromAvg(avg) : null
                    return (
                      <div key={ins.id} className="relative mb-4 last:mb-0">
                        <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-[#00ff88] bg-[#0a0a0f]" />
                        <div className="p-3 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.04)]">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs font-mono text-[#00ff88] font-bold">{ins.promotion?.filiere?.nom} — {ins.promotion?.niveau}</p>
                              <p className="text-[10px] font-mono text-[#6b6b8a]">{ins.promotion?.anneeScolaire}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {dossierBadge(ins.statutDossier)}
                              {ins.redoublant && <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/20">Redoublant</span>}
                            </div>
                          </div>
                          {/* Grade summary */}
                          {avg !== null && (
                            <div className="flex items-center gap-3 mb-2 p-2 rounded bg-[#0a0a0f] border border-[rgba(255,255,255,0.04)]">
                              <span className={`text-sm font-mono font-bold ${avg >= 10 ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{avg.toFixed(2)}</span>
                              <span className="text-[10px] font-mono text-[#6b6b8a]">Moyenne</span>
                              {mention && <span className="ml-auto">{mentionBadge(mention)}</span>}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={() => setShowInscriptionDetail(ins)} className="px-2 py-1 text-[10px] font-mono rounded bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
                              <Eye className="w-3 h-3" /> Détails
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-mono text-[#e0e0e6] flex items-center gap-2"><FileText className="w-4 h-4 text-[#ffaa00]" /> Documents</h3>
                <button onClick={() => setShowDocumentForm(true)} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>
              {/* Dossier checklist */}
              {(() => {
                const required = ['Acte de naissance', 'Relevé de notes', 'Diplôme', 'Photo']
                const presentTypes = new Set(s.documents?.map(d => d.type) || [])
                const pct = Math.round((required.filter(r => presentTypes.has(r)).length / required.length) * 100)
                return (
                  <div className="mb-3 p-3 rounded-lg bg-[#0a0a0f] border border-[rgba(255,255,255,0.04)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-[#6b6b8a]">Complétude du dossier</span>
                      <span className={`text-[10px] font-mono font-bold ${pct === 100 ? 'text-[#00ff88]' : pct >= 50 ? 'text-[#ffaa00]' : 'text-[#ff4444]'}`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct === 100 ? '#00ff88' : pct >= 50 ? '#ffaa00' : '#ff4444' }} />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {required.map(dt => {
                        const present = presentTypes.has(dt)
                        return (
                          <div key={dt} className={`flex items-center gap-1.5 text-[10px] font-mono ${present ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
                            {present ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {dt}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
              {(!s.documents || s.documents.length === 0) ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-xs font-mono text-[#6b6b8a]">Aucun document</p>
                  <p className="text-[10px] font-mono text-[#6b6b8a]">Ajoutez les documents requis pour compléter le dossier</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {s.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.04)]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#6b6b8a]">{getDocTypeIcon(doc.type)}</span>
                        <div>
                          <p className="text-xs font-mono text-[#e0e0e6]">{doc.titre}</p>
                          <p className="text-[10px] font-mono text-[#6b6b8a]">{doc.type}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-[#6b6b8a] hover:text-[#ff4444] transition-colors focus-ring"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========================
  // PROMOTIONS VIEW
  // ========================
  const PromotionsView = () => {
    if (selectedPromotion) return <PromotionDetailView />
    const filtered = promotions.filter(p => {
      if (promoFilterAnnee && p.anneeScolaire !== promoFilterAnnee) return false
      if (promoFilterFiliere && p.filiereId !== promoFilterFiliere) return false
      if (promoFilterStatut && p.statut !== promoFilterStatut) return false
      return true
    })

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select value={promoFilterAnnee} onChange={e => setPromoFilterAnnee(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="">Toutes les années</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={promoFilterFiliere} onChange={e => setPromoFilterFiliere(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="">Toutes les filières</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <select value={promoFilterStatut} onChange={e => setPromoFilterStatut(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="Clôturée">Clôturée</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFiliereForm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
              <Plus className="w-3 h-3" /> Filière
            </button>
            <button onClick={() => setShowPromotionForm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
              <Plus className="w-3 h-3" /> Promotion
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-sm font-mono text-[#6b6b8a]">Aucune promotion trouvée</p>
            <p className="text-[10px] font-mono text-[#6b6b8a] mt-1">Créez une filière puis une promotion pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((promo, i) => {
              const fColor = getFiliereColor(promo.filiere?.code || '')
              const inscriptions = promo.inscriptions || []
              const completeCount = inscriptions.filter(ins => ins.statutDossier === 'Complet' || ins.statutDossier === 'Validé').length
              const totalIns = inscriptions.length
              const pct = totalIns > 0 ? Math.round((completeCount / totalIns) * 100) : 0
              return (
                <motion.div key={promo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,255,136,0.2)] cursor-pointer transition-all duration-300 group relative overflow-hidden btn-micro"
                  onClick={() => { setSelectedPromotion(promo); setPromoTab('resume') }}>
                  {/* Filiere color accent */}
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: fColor }} />
                  <div className="flex items-start justify-between mb-2 ml-2">
                    <div>
                      <p className="text-sm font-mono text-[#e0e0e6] font-bold">{promo.filiere?.nom}</p>
                      <p className="text-xs font-mono text-[#00ff88]">{promo.niveau} — {promo.anneeScolaire}</p>
                    </div>
                    {promo.statut === 'Clôturée' ? (
                      <span className="px-2 py-1 rounded text-[10px] font-mono bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 flex items-center gap-1"><Lock className="w-3 h-3" /> Clôturée</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-[10px] font-mono bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20">En cours</span>
                    )}
                  </div>
                  <div className="ml-2 flex items-center gap-3 text-[10px] font-mono text-[#6b6b8a] mb-2">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {promo._count?.inscriptions || 0} inscrits</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {promo._count?.matieres || 0} matières</span>
                  </div>
                  {/* Dossier completeness bar */}
                  {totalIns > 0 && (
                    <div className="ml-2">
                      <div className="flex justify-between text-[10px] font-mono mb-1">
                        <span className="text-[#6b6b8a]">Dossiers complets</span>
                        <span className="text-[#e0e0e6]">{completeCount}/{totalIns}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${fColor}88, ${fColor})` }} />
                      </div>
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#6b6b8a] absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ========================
  // PROMOTION DETAIL VIEW
  // ========================
  const PromotionDetailView = () => {
    if (!selectedPromotion) return null
    const p = selectedPromotion
    const isClosed = p.statut === 'Clôturée'
    const inscriptions = p.inscriptions || []
    const completeCount = inscriptions.filter(ins => ins.statutDossier === 'Complet' || ins.statutDossier === 'Validé').length
    const incompleteCount = inscriptions.filter(ins => ins.statutDossier === 'Incomplet').length

    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedPromotion(null); setPromoTab('resume') }} className="flex items-center gap-2 text-xs font-mono text-[#6b6b8a] hover:text-[#00ff88] transition-colors focus-ring">
          <ArrowLeft className="w-4 h-4" /> Retour aux promotions
        </button>

        {/* Closed Banner */}
        {isClosed && (
          <div className="p-3 rounded-xl bg-[#ff4444]/5 border border-[#ff4444]/20 flex items-center gap-3">
            <Lock className="w-6 h-6 text-[#ff4444] flex-shrink-0" />
            <div>
              <p className="text-sm font-mono text-[#ff4444] font-bold">PROMOTION CLÔTURÉE — Aucune modification possible</p>
              {p.dateCloture && <p className="text-xs font-mono text-[#6b6b8a]">Clôturée le {p.dateCloture}</p>}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-mono font-bold text-[#e0e0e6]">{p.filiere?.nom} — {p.niveau}</h2>
              <p className="text-xs font-mono text-[#6b6b8a]">{p.anneeScolaire} • {p.filiere?.code} • {isClosed ? 'Clôturée' : 'En cours'}</p>
            </div>
            <div className="flex gap-2">
              {!isClosed && (
                <button onClick={() => setShowClotureConfirm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
                  <Lock className="w-3 h-3" /> Clôturer
                </button>
              )}
              {!isClosed && (
                <button onClick={() => setShowDeleteConfirm({ type: 'promotion', id: p.id, name: `${p.filiere?.nom} ${p.niveau}` })} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          {['resume', 'inscriptions', 'matieres', 'notes'].map(tab => (
            <button key={tab} onClick={() => setPromoTab(tab)}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-mono transition-all focus-ring ${promoTab === tab ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-[#6b6b8a] hover:text-[#e0e0e6]'}`}>
              {tab === 'resume' ? 'Résumé' : tab === 'inscriptions' ? 'Inscriptions' : tab === 'matieres' ? 'Matières' : 'Notes'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {promoTab === 'resume' && <PromoResumeTab key="res" promotion={p} isClosed={isClosed} completeCount={completeCount} incompleteCount={incompleteCount} />}
          {promoTab === 'inscriptions' && <PromoInscriptionsTab key="insc" promotion={p} isClosed={isClosed} />}
          {promoTab === 'matieres' && <PromoMatieresTab key="mat" promotion={p} isClosed={isClosed} />}
          {promoTab === 'notes' && <PromoNotesTab key="not" promotion={p} isClosed={isClosed} />}
        </AnimatePresence>
      </div>
    )
  }

  // ========================
  // PROMO RESUME TAB
  // ========================
  const PromoResumeTab = ({ promotion, isClosed, completeCount, incompleteCount }: { promotion: Promotion; isClosed: boolean; completeCount: number; incompleteCount: number }) => {
    const inscriptions = promotion.inscriptions || []
    const totalIns = inscriptions.length
    const tauxComplet = totalIns > 0 ? Math.round((completeCount / totalIns) * 100) : 0
    const recentNotes = inscriptions.flatMap(ins => ins.notes || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center stat-glow">
            <p className="text-[10px] font-mono text-[#6b6b8a]">Inscrits</p>
            <p className="text-lg font-mono font-bold text-[#00ff88]">{totalIns}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center stat-glow">
            <p className="text-[10px] font-mono text-[#6b6b8a]">Dossiers complets</p>
            <p className="text-lg font-mono font-bold text-[#00d4ff]">{completeCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center stat-glow">
            <p className="text-[10px] font-mono text-[#6b6b8a]">Dossiers incomplets</p>
            <p className="text-lg font-mono font-bold text-[#ff4444]">{incompleteCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center stat-glow">
            <p className="text-[10px] font-mono text-[#6b6b8a]">Taux complétude</p>
            <p className="text-lg font-mono font-bold text-[#ffaa00]">{tauxComplet}%</p>
          </div>
        </div>

        {/* Dossier completeness visual */}
        <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <h4 className="text-xs font-mono text-[#e0e0e6] mb-3 flex items-center gap-2"><FolderCheck className="w-4 h-4 text-[#00ff88]" /> Complétude des dossiers</h4>
          <div className="h-3 rounded-full bg-[#1a1a2e] overflow-hidden">
            <div className="h-full rounded-full flex">
              <div className="h-full bg-[#00ff88]" style={{ width: `${tauxComplet}%`, transition: 'width 0.5s' }} />
              <div className="h-full bg-[#ffaa00]" style={{ width: `${totalIns > 0 ? ((totalIns - completeCount - incompleteCount) / totalIns) * 100 : 0}%` }} />
              <div className="h-full bg-[#ff4444]" style={{ width: `${totalIns > 0 ? (incompleteCount / totalIns) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-[#00ff88]"><span className="w-2 h-2 rounded-full bg-[#00ff88]" /> Complets</span>
            <span className="flex items-center gap-1 text-[#ffaa00]"><span className="w-2 h-2 rounded-full bg-[#ffaa00]" /> En attente</span>
            <span className="flex items-center gap-1 text-[#ff4444]"><span className="w-2 h-2 rounded-full bg-[#ff4444]" /> Incomplets</span>
          </div>
        </div>

        {/* Recent grade entries */}
        {recentNotes.length > 0 && (
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h4 className="text-xs font-mono text-[#e0e0e6] mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#00d4ff]" /> Dernières notes saisies</h4>
            <div className="space-y-2">
              {recentNotes.map(n => (
                <div key={n.id} className="flex items-center justify-between p-2 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.04)] text-xs font-mono">
                  <span className="text-[#e0e0e6]">{n.matiere?.nom}</span>
                  <span className={`font-bold ${n.moyenne !== null && n.moyenne >= 10 ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{n.moyenne?.toFixed(2) || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {!isClosed && (
            <button onClick={() => setShowInscriptionForm(true)} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-2 btn-micro focus-ring">
              <UserPlus className="w-4 h-4" /> Inscrire un étudiant
            </button>
          )}
          {!isClosed && (
            <button onClick={() => { setEditingMatiere(null); setShowMatiereForm(true) }} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-2 btn-micro focus-ring">
              <Plus className="w-4 h-4" /> Ajouter une matière
            </button>
          )}
          <button onClick={() => setPromoTab('notes')} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#1a1a2e] text-[#6b6b8a] border border-[rgba(255,255,255,0.06)] hover:text-[#e0e0e6] transition-colors flex items-center gap-2 btn-micro focus-ring">
            <BookOpen className="w-4 h-4" /> Voir les notes
          </button>
        </div>
      </motion.div>
    )
  }

  // ========================
  // PROMO INSCRIPTIONS TAB
  // ========================
  const PromoInscriptionsTab = ({ promotion, isClosed }: { promotion: Promotion; isClosed: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-[#6b6b8a]">{promotion.inscriptions?.length || 0} inscrits</p>
        {!isClosed && (
          <button onClick={() => setShowInscriptionForm(true)} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
            <UserPlus className="w-3 h-3" /> Inscrire
          </button>
        )}
      </div>
      {(!promotion.inscriptions || promotion.inscriptions.length === 0) ? (
        <div className="text-center py-8"><div className="text-4xl mb-2">👥</div><p className="text-xs font-mono text-[#6b6b8a]">Aucun étudiant inscrit</p><p className="text-[10px] font-mono text-[#6b6b8a]">Inscrivez des étudiants pour commencer la saisie des notes</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
              <th className="py-2 px-3 text-left">Matricule</th><th className="py-2 px-3 text-left">Nom</th><th className="py-2 px-3 text-left">Dossier</th><th className="py-2 px-3 text-left">Statut</th><th className="py-2 px-3 text-left">Redoublant</th><th className="py-2 px-3 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {promotion.inscriptions.map(ins => (
                <tr key={ins.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1a1a2e]/50 transition-colors">
                  <td className="py-2 px-3 text-[#00ff88]">{ins.student?.matricule}</td>
                  <td className="py-2 px-3 text-[#e0e0e6]">{ins.student?.nom} {ins.student?.prenom}</td>
                  <td className="py-2 px-3">{dossierBadge(ins.statutDossier)}</td>
                  <td className="py-2 px-3 text-[#e0e0e6]">{ins.statut}</td>
                  <td className="py-2 px-3">{ins.redoublant ? <span className="text-[#ffaa00]">Oui</span> : 'Non'}</td>
                  <td className="py-2 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => setShowInscriptionDetail(ins)} className="p-1 rounded text-[#6b6b8a] hover:text-[#00d4ff] transition-colors focus-ring"><Eye className="w-3 h-3" /></button>
                      {!isClosed && <button onClick={() => handleUpdateInscriptionDossier(ins)} className="p-1 rounded text-[#6b6b8a] hover:text-[#00ff88] transition-colors focus-ring"><Edit3 className="w-3 h-3" /></button>}
                      {!isClosed && <button onClick={() => handleDeleteInscription(ins.id)} className="p-1 rounded text-[#6b6b8a] hover:text-[#ff4444] transition-colors focus-ring"><Trash2 className="w-3 h-3" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )

  // ========================
  // PROMO MATIERES TAB
  // ========================
  const PromoMatieresTab = ({ promotion, isClosed }: { promotion: Promotion; isClosed: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-[#6b6b8a]">{promotion.matieres?.length || 0} matières</p>
        {!isClosed && (
          <button onClick={() => { setEditingMatiere(null); setShowMatiereForm(true) }} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        )}
      </div>
      {(!promotion.matieres || promotion.matieres.length === 0) ? (
        <div className="text-center py-8"><div className="text-4xl mb-2">📖</div><p className="text-xs font-mono text-[#6b6b8a]">Aucune matière</p><p className="text-[10px] font-mono text-[#6b6b8a]">Ajoutez des matières pour structurer l'enseignement</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
              <th className="py-2 px-3 text-left">Code</th><th className="py-2 px-3 text-left">Nom</th><th className="py-2 px-3 text-left">Coefficient</th><th className="py-2 px-3 text-left">Semestre</th><th className="py-2 px-3 text-left">Actions</th>
            </tr></thead>
            <tbody>
              {promotion.matieres.map(mat => (
                <tr key={mat.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1a1a2e]/50 transition-colors">
                  <td className="py-2 px-3 text-[#00ff88]">{mat.code}</td>
                  <td className="py-2 px-3 text-[#e0e0e6]">{mat.nom}</td>
                  <td className="py-2 px-3 text-[#e0e0e6]">{mat.coefficient}</td>
                  <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-[10px] ${mat.semestre === 1 ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20' : 'bg-[#c084fc]/10 text-[#c084fc] border border-[#c084fc]/20'}`}>S{mat.semestre}</span></td>
                  <td className="py-2 px-3">
                    {!isClosed && (
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingMatiere(mat); setShowMatiereForm(true) }} className="p-1 rounded text-[#6b6b8a] hover:text-[#00ff88] transition-colors focus-ring"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => handleDeleteMatiere(mat.id)} className="p-1 rounded text-[#6b6b8a] hover:text-[#ff4444] transition-colors focus-ring"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )

  // ========================
  // PROMO NOTES TAB (Spreadsheet-like)
  // ========================
  const PromoNotesTab = ({ promotion, isClosed }: { promotion: Promotion; isClosed: boolean }) => {
    const matieres = promotion.matieres || []
    const inscriptions = promotion.inscriptions || []
    const [noteValues, setNoteValues] = useState<Record<string, { noteCC: string; noteExam: string; noteTP: string }>>({})
    const [editingCell, setEditingCell] = useState<string | null>(null)
    const [batchMatiere, setBatchMatiere] = useState<string>('')
    const [batchMode, setBatchMode] = useState(false)

    const selectedMatiere = selectedMatiereForNotes

    if (matieres.length === 0) return <div className="text-center py-8"><div className="text-4xl mb-2">📖</div><p className="text-xs font-mono text-[#6b6b8a]">Ajoutez d&apos;abord des matières</p></div>
    if (inscriptions.length === 0) return <div className="text-center py-8"><div className="text-4xl mb-2">👥</div><p className="text-xs font-mono text-[#6b6b8a]">Aucun étudiant inscrit</p></div>

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
        {isClosed && (
          <div className="p-3 rounded-lg bg-[#ff4444]/5 border border-[#ff4444]/10 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#ff4444]" />
            <span className="text-xs font-mono text-[#ff4444]">Notes verrouillées — Année clôturée</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-[#6b6b8a]">Matière :</label>
            <select value={selectedMatiere?.id || ''} onChange={e => {
              const mat = matieres.find(m => m.id === e.target.value) || null
              setSelectedMatiereForNotes(mat)
            }} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="">Sélectionner</option>
              {matieres.map(m => <option key={m.id} value={m.id}>S{m.semestre} — {m.code} {m.nom} (Coef: {m.coefficient})</option>)}
            </select>
          </div>
          {!isClosed && (
            <button onClick={() => setBatchMode(!batchMode)} className={`px-3 py-2 text-xs font-mono rounded-lg transition-colors flex items-center gap-1 focus-ring ${batchMode ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'bg-[#1a1a2e] text-[#6b6b8a] border border-[rgba(255,255,255,0.06)]'}`}>
              <Grid3X3 className="w-3 h-3" /> {batchMode ? 'Mode individuel' : 'Mode batch'}
            </button>
          )}
          {!isClosed && batchMode && selectedMatiere && (
            <button onClick={async () => {
              const entries = Object.entries(noteValues).filter(([key]) => key.includes(selectedMatiere.id))
              let saved = 0
              for (const [key, vals] of entries) {
                const [insId] = key.split('-')
                try {
                  await api.post('/api/notes', {
                    inscriptionId: insId, matiereId: selectedMatiere.id,
                    noteCC: vals.noteCC ? parseFloat(vals.noteCC) : null,
                    noteExam: vals.noteExam ? parseFloat(vals.noteExam) : null,
                    noteTP: vals.noteTP ? parseFloat(vals.noteTP) : null,
                  })
                  saved++
                } catch { /* skip */ }
              }
              toast.success(`${saved} note(s) enregistrée(s)`)
              await refreshSelectedPromotion()
              setNoteValues({})
            }} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 btn-micro focus-ring animate-pulse-btn">
              <Save className="w-3 h-3" /> Sauver tout
            </button>
          )}
        </div>

        {selectedMatiere && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
                <th className="py-2 px-3 text-left">Matricule</th><th className="py-2 px-3 text-left">Nom</th>
                <th className="py-2 px-3 text-center">CC (30%)</th><th className="py-2 px-3 text-center">Exam (50%)</th><th className="py-2 px-3 text-center">TP (20%)</th>
                <th className="py-2 px-3 text-center">Moyenne</th>
                {!isClosed && <th className="py-2 px-3 text-center">Action</th>}
              </tr></thead>
              <tbody>
                {inscriptions.map(ins => {
                  const existingNote = ins.notes?.find(n => n.matiereId === selectedMatiere.id)
                  const key = `${ins.id}-${selectedMatiere.id}`
                  const vals = noteValues[key] || {
                    noteCC: existingNote?.noteCC?.toString() || '',
                    noteExam: existingNote?.noteExam?.toString() || '',
                    noteTP: existingNote?.noteTP?.toString() || '',
                  }
                  return (
                    <tr key={ins.id} className="border-b border-[rgba(255,255,255,0.03)]">
                      <td className="py-2 px-3 text-[#00ff88]">{ins.student?.matricule}</td>
                      <td className="py-2 px-3 text-[#e0e0e6]">{ins.student?.nom} {ins.student?.prenom}</td>
                      <td className="py-2 px-3"><input type="number" step="0.01" min="0" max="20" disabled={isClosed} value={vals.noteCC} onChange={e => setNoteValues(v => ({ ...v, [key]: { ...v[key] || { noteCC: '', noteExam: '', noteTP: '' }, noteCC: e.target.value } }))} className="w-16 px-2 py-1 rounded text-center terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] disabled:opacity-50 focus-ring" /></td>
                      <td className="py-2 px-3"><input type="number" step="0.01" min="0" max="20" disabled={isClosed} value={vals.noteExam} onChange={e => setNoteValues(v => ({ ...v, [key]: { ...v[key] || { noteCC: '', noteExam: '', noteTP: '' }, noteExam: e.target.value } }))} className="w-16 px-2 py-1 rounded text-center terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] disabled:opacity-50 focus-ring" /></td>
                      <td className="py-2 px-3"><input type="number" step="0.01" min="0" max="20" disabled={isClosed} value={vals.noteTP} onChange={e => setNoteValues(v => ({ ...v, [key]: { ...v[key] || { noteCC: '', noteExam: '', noteTP: '' }, noteTP: e.target.value } }))} className="w-16 px-2 py-1 rounded text-center terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] disabled:opacity-50 focus-ring" /></td>
                      <td className="py-2 px-3 text-center"><span className={`font-bold ${existingNote?.moyenne !== null && existingNote?.moyenne !== undefined ? (existingNote.moyenne >= 10 ? 'text-[#00ff88]' : 'text-[#ff4444]') : 'text-[#6b6b8a]'}`}>{existingNote?.moyenne?.toFixed(2) || '—'}</span></td>
                      {!isClosed && (
                        <td className="py-2 px-3 text-center">
                          <button onClick={() => handleSaveNote(ins.id, selectedMatiere.id, vals)} className="px-2 py-1 rounded text-[10px] bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 mx-auto btn-micro focus-ring">
                            <Save className="w-3 h-3" /> Sauver
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Spreadsheet overview (all matieres x all students) */}
        {!selectedMatiere && matieres.length > 0 && inscriptions.length > 0 && (
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h4 className="text-xs font-mono text-[#e0e0e6] mb-3 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-[#00ff88]" /> Vue synthétique des moyennes</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
                  <th className="py-2 px-2 text-left sticky left-0 bg-[#12121a] z-10">Étudiant</th>
                  {matieres.map(m => <th key={m.id} className="py-2 px-2 text-center min-w-[60px]"><span className="text-[9px]" title={m.nom}>{m.code}</span></th>)}
                </tr></thead>
                <tbody>
                  {inscriptions.map(ins => (
                    <tr key={ins.id} className="border-b border-[rgba(255,255,255,0.03)]">
                      <td className="py-1.5 px-2 text-[#e0e0e6] sticky left-0 bg-[#12121a] z-10 whitespace-nowrap">{ins.student?.nom}</td>
                      {matieres.map(m => {
                        const note = ins.notes?.find(n => n.matiereId === m.id)
                        const moy = note?.moyenne
                        return (
                          <td key={m.id} className={`py-1.5 px-2 text-center font-bold ${moy !== null && moy !== undefined ? (moy >= 10 ? 'text-[#00ff88] bg-[#00ff88]/5' : 'text-[#ff4444] bg-[#ff4444]/5') : 'text-[#6b6b8a]'}`} title={m.nom}>
                            {moy?.toFixed(1) || '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  // ========================
  // FILIERES VIEW
  // ========================
  const FilieresView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-[#e0e0e6] flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#00d4ff]" /> Filières</h3>
        <button onClick={() => setShowFiliereForm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
          <Plus className="w-3 h-3" /> Nouvelle filière
        </button>
      </div>
      {filieres.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📖</div>
          <p className="text-sm font-mono text-[#6b6b8a]">Aucune filière créée</p>
          <p className="text-[10px] font-mono text-[#6b6b8a] mt-1">Les filières sont les programmes d'études proposés</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filieres.map((f, i) => {
            const fColor = getFiliereColor(f.code)
            const promoCount = promotions.filter(p => p.filiereId === f.id).length
            const studentCount = promotions.filter(p => p.filiereId === f.id).reduce((s, p) => s + (p._count?.inscriptions || 0), 0)
            const matiereCount = f._count?.matieres || 0
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,255,136,0.2)] transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: fColor }} />
                <div className="ml-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-mono text-[#00ff88] font-bold">{f.code}</p>
                      <p className="text-xs font-mono text-[#e0e0e6]">{f.nom}</p>
                      {f.niveau && <p className="text-[10px] font-mono text-[#6b6b8a]">{f.niveau}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditingFiliere(f); setShowFiliereForm(true) }} className="p-1 text-[#6b6b8a] hover:text-[#00d4ff] transition-colors focus-ring"><Edit3 className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm({ type: 'filiere', id: f.id, name: f.nom }) }} className="p-1 text-[#6b6b8a] hover:text-[#ff4444] transition-colors focus-ring"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="flex gap-3 text-[10px] font-mono text-[#6b6b8a]">
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {promoCount} promos</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {studentCount} étud.</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {matiereCount} matières</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ========================
  // PALMARES VIEW
  // ========================
  const PalmaresView = () => {
    // Class statistics
    const calcStats = () => {
      if (!palmaresData || palmaresData.palmares.length === 0) return null
      const avgs = palmaresData.palmares.map(p => p.moyenneAnnuelle).filter((v): v is number => v !== null)
      if (avgs.length === 0) return null
      const sorted = [...avgs].sort((a, b) => a - b)
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)]
      const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length
      const variance = avgs.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / avgs.length
      const ecartType = Math.sqrt(variance)
      return { min, max, median, ecartType: Math.round(ecartType * 100) / 100 }
    }

    const classStats = calcStats()

    // Filter by semester
    const getDisplayAvg = (entry: PalmaresEntry) => {
      if (palmaresSemester === 'S1') return entry.moyenneS1
      if (palmaresSemester === 'S2') return entry.moyenneS2
      return entry.moyenneAnnuelle
    }

    const sortedPalmares = palmaresData ? [...palmaresData.palmares].sort((a, b) => {
      const ma = getDisplayAvg(a) ?? -1
      const mb = getDisplayAvg(b) ?? -1
      return mb - ma
    }).map((p, i) => ({ ...p, rang: i + 1 })) : []

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select value={palmaresPromotionId} onChange={e => { setPalmaresPromotionId(e.target.value); if (e.target.value) loadPalmares(e.target.value) }} className="px-4 py-2 rounded-lg terminal-input text-sm font-mono text-[#e0e0e6] bg-[#12121a] min-w-[300px] focus-ring">
            <option value="">Sélectionner une promotion</option>
            {promotions.filter(p => p.statut === 'Clôturée').map(p => <option key={p.id} value={p.id}>{p.filiere?.nom} — {p.niveau} ({p.anneeScolaire})</option>)}
            {promotions.filter(p => p.statut === 'En cours').map(p => <option key={p.id} value={p.id}>{p.filiere?.nom} — {p.niveau} ({p.anneeScolaire}) — En cours</option>)}
          </select>
          {palmaresData && (
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden">
                {(['S1', 'S2', 'annual'] as const).map(s => (
                  <button key={s} onClick={() => setPalmaresSemester(s)} className={`px-3 py-1.5 text-[10px] font-mono transition-colors focus-ring ${palmaresSemester === s ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'text-[#6b6b8a] hover:text-[#e0e0e6]'}`}>
                    {s === 'annual' ? 'Annuel' : s}
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#1a1a2e] text-[#6b6b8a] border border-[rgba(255,255,255,0.06)] hover:text-[#e0e0e6] transition-colors flex items-center gap-1 btn-micro focus-ring no-print">
                <Printer className="w-3 h-3" /> Imprimer
              </button>
            </div>
          )}
        </div>

        {palmaresData ? (
          <div className="space-y-4 print-only">
            {/* Header */}
            <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center">
              <h2 className="text-lg font-mono font-bold text-[#00ff88] neon-text">PALMARÈS</h2>
              <p className="text-sm font-mono text-[#e0e0e6]">{palmaresData.promotion.filiere.nom} — {palmaresData.promotion.niveau}</p>
              <p className="text-xs font-mono text-[#6b6b8a]">Année scolaire {palmaresData.promotion.anneeScolaire}</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center stat-glow">
                <p className="text-[10px] font-mono text-[#6b6b8a]">Moy. de classe</p>
                <p className="text-lg font-mono font-bold text-[#00ff88]">{palmaresData.statistics.classAvg.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center stat-glow">
                <p className="text-[10px] font-mono text-[#6b6b8a]">Taux de réussite</p>
                <p className="text-lg font-mono font-bold text-[#00d4ff]">{palmaresData.statistics.passRate}%</p>
              </div>
              <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center stat-glow">
                <p className="text-[10px] font-mono text-[#6b6b8a]">Effectif</p>
                <p className="text-lg font-mono font-bold text-[#e0e0e6]">{palmaresData.statistics.totalStudents}</p>
              </div>
              <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center stat-glow">
                <p className="text-[10px] font-mono text-[#6b6b8a]">Réussis</p>
                <p className="text-lg font-mono font-bold text-[#ffaa00]">{palmaresData.palmares.filter(p => p.moyenneAnnuelle !== null && p.moyenneAnnuelle >= 10).length}</p>
              </div>
            </div>

            {/* Podium - Top 3 */}
            {sortedPalmares.length >= 3 && (
              <div className="grid grid-cols-3 gap-3">
                {[1, 0, 2].map(rankIdx => {
                  const entry = sortedPalmares[rankIdx]
                  if (!entry) return null
                  const medal = rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : '🥉'
                  const borderColor = rankIdx === 0 ? 'border-[#ffd93d]/30' : rankIdx === 1 ? 'border-[#c0c0c0]/30' : 'border-[#cd7f32]/30'
                  const bgColor = rankIdx === 0 ? 'bg-[#ffd93d]/5' : rankIdx === 1 ? 'bg-[#c0c0c0]/5' : 'bg-[#cd7f32]/5'
                  const avg = getDisplayAvg(entry)
                  return (
                    <motion.div key={entry.inscriptionId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rankIdx * 0.15 }}
                      className={`p-4 rounded-xl ${bgColor} border ${borderColor} text-center`}>
                      <span className="text-3xl">{medal}</span>
                      <p className="text-sm font-mono font-bold text-[#e0e0e6] mt-2">{entry.nom} {entry.prenom}</p>
                      <p className="text-xs font-mono text-[#6b6b8a]">{entry.matricule}</p>
                      <p className={`text-lg font-mono font-bold mt-1 ${avg !== null && avg >= 10 ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{avg?.toFixed(2) || '—'}</p>
                      {entry.moyenneAnnuelle !== null && <div className="mt-1">{mentionBadge(entry.mention)}</div>}
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Ranking Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
                  <th className="py-2 px-3 text-center">Rang</th><th className="py-2 px-3 text-left">Matricule</th><th className="py-2 px-3 text-left">Nom & Prénom</th>
                  <th className="py-2 px-3 text-center">Moy. S1</th><th className="py-2 px-3 text-center">Moy. S2</th><th className="py-2 px-3 text-center">Moy. Annuelle</th>
                  <th className="py-2 px-3 text-center">Crédits</th><th className="py-2 px-3 text-center">Mention</th>
                </tr></thead>
                <tbody>
                  {sortedPalmares.map(entry => {
                    const rankClass = entry.rang === 1 ? 'border-l-2 border-l-[#ffd93d] bg-[#ffd93d]/5' : entry.rang === 2 ? 'border-l-2 border-l-[#c0c0c0] bg-[#c0c0c0]/5' : entry.rang === 3 ? 'border-l-2 border-l-[#cd7f32] bg-[#cd7f32]/5' : ''
                    const isExpanded = expandedPalmaresRow === entry.inscriptionId
                    return (
                      <React.Fragment key={entry.inscriptionId}>
                        <tr className={`border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1a1a2e]/50 transition-colors cursor-pointer ${rankClass}`} onClick={() => setExpandedPalmaresRow(isExpanded ? null : entry.inscriptionId)}>
                          <td className="py-2 px-3 text-center">
                            {entry.rang <= 3 ? <span className="text-base">{entry.rang === 1 ? '🥇' : entry.rang === 2 ? '🥈' : '🥉'}</span> : <span className="text-[#6b6b8a]">{entry.rang}</span>}
                          </td>
                          <td className="py-2 px-3 text-[#00ff88]">{entry.matricule}</td>
                          <td className="py-2 px-3 text-[#e0e0e6]">{entry.nom} {entry.prenom}{entry.redoublant ? ' (R)' : ''}</td>
                          <td className="py-2 px-3 text-center text-[#e0e0e6]">{entry.moyenneS1?.toFixed(2) || '—'}</td>
                          <td className="py-2 px-3 text-center text-[#e0e0e6]">{entry.moyenneS2?.toFixed(2) || '—'}</td>
                          <td className="py-2 px-3 text-center font-bold text-[#e0e0e6]">{entry.moyenneAnnuelle?.toFixed(2) || '—'}</td>
                          <td className="py-2 px-3 text-center text-[#00d4ff]">{entry.totalCredits}</td>
                          <td className="py-2 px-3 text-center">{mentionBadge(entry.mention)}</td>
                        </tr>
                        {isExpanded && entry.notes.length > 0 && (
                          <tr>
                            <td colSpan={8} className="p-3 bg-[#0a0a0f]">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {entry.notes.map((n, ni) => (
                                  <div key={ni} className="flex items-center justify-between p-2 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.04)]">
                                    <div>
                                      <p className="text-[10px] font-mono text-[#e0e0e6]">{n.matiereNom}</p>
                                      <p className="text-[9px] font-mono text-[#6b6b8a]">S{n.semestre} • Coef {n.coefficient}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-xs font-mono font-bold ${n.moyenne !== null && n.moyenne >= 10 ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{n.moyenne?.toFixed(2) || '—'}</p>
                                      <p className="text-[9px] font-mono text-[#6b6b8a]">CC:{n.noteCC ?? '—'} Ex:{n.noteExam ?? '—'} TP:{n.noteTP ?? '—'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mention Distribution + Class Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Mention donut */}
              <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
                <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00d4ff]" /> Répartition par mention</h3>
                {(() => {
                  const dist = palmaresData.statistics.mentionDistribution
                  const total = Object.values(dist).reduce((a, b) => a + b, 0)
                  const colors: Record<string, string> = { 'Très Bien': '#00ff88', 'Bien': '#00d4ff', 'Assez Bien': '#44ddff', 'Passable': '#ffaa00', 'Ajourné': '#ff4444', '-': '#6b6b8a' }
                  let offset = 0
                  return (
                    <div className="flex items-center gap-6">
                      <svg width="100" height="100" viewBox="0 0 36 36" className="transform -rotate-90 flex-shrink-0">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                        {Object.entries(dist).map(([mention, count]) => {
                          const pct = total > 0 ? (count / total) * 100 : 0
                          const c = colors[mention] || '#6b6b8a'
                          const currentOffset = offset
                          offset += pct
                          return <circle key={mention} cx="18" cy="18" r="15.9" fill="none" stroke={c} strokeWidth="3"
                            strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-currentOffset} strokeLinecap="round" />
                        })}
                      </svg>
                      <div className="space-y-2 flex-1">
                        {Object.entries(dist).map(([mention, count]) => (
                          <div key={mention} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">{mentionBadge(mention)} <span className="text-xs font-mono text-[#e0e0e6]">× {count}</span></div>
                            <span className="text-[10px] font-mono text-[#6b6b8a]">{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Class Stats */}
              {classStats && (
                <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
                  <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-[#ffaa00]" /> Statistiques de classe</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Minimum', value: classStats.min.toFixed(2), color: 'text-[#ff4444]' },
                      { label: 'Maximum', value: classStats.max.toFixed(2), color: 'text-[#00ff88]' },
                      { label: 'Médiane', value: classStats.median.toFixed(2), color: 'text-[#00d4ff]' },
                      { label: 'Écart-type', value: classStats.ecartType.toFixed(2), color: 'text-[#ffaa00]' },
                    ].map(s => (
                      <div key={s.label} className="p-3 rounded-lg bg-[#0a0a0f] border border-[rgba(255,255,255,0.04)] text-center">
                        <p className="text-[10px] font-mono text-[#6b6b8a]">{s.label}</p>
                        <p className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Semester Comparison Chart */}
            {palmaresData.palmares.some(p => p.moyenneS1 !== null && p.moyenneS2 !== null) && (
              <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
                <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#c084fc]" /> Comparaison S1 vs S2</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {palmaresData.palmares.filter(p => p.moyenneS1 !== null || p.moyenneS2 !== null).slice(0, 15).map(p => {
                    const maxMoy = 20
                    return (
                      <div key={p.inscriptionId} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#6b6b8a] w-24 truncate" title={`${p.nom} ${p.prenom}`}>{p.nom}</span>
                        <div className="flex-1 flex gap-1">
                          <div className="flex-1 h-4 rounded bg-[#1a1a2e] overflow-hidden relative">
                            <div className="h-full bg-[#00d4ff]/60 rounded" style={{ width: `${((p.moyenneS1 || 0) / maxMoy) * 100}%` }} />
                          </div>
                          <div className="flex-1 h-4 rounded bg-[#1a1a2e] overflow-hidden relative">
                            <div className="h-full bg-[#c084fc]/60 rounded" style={{ width: `${((p.moyenneS2 || 0) / maxMoy) * 100}%` }} />
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-[#6b6b8a] w-8">{p.moyenneAnnuelle?.toFixed(1) || '—'}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-4 mt-2 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#00d4ff]"><span className="w-3 h-2 rounded bg-[#00d4ff]/60" /> S1</span>
                  <span className="flex items-center gap-1 text-[#c084fc]"><span className="w-3 h-2 rounded bg-[#c084fc]/60" /> S2</span>
                </div>
              </div>
            )}
          </div>
        ) : palmaresPromotionId ? (
          <div className="text-center py-16"><div className="text-4xl mb-3">⏳</div><p className="text-xs font-mono text-[#6b6b8a]">Chargement du palmarès...</p></div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-sm font-mono text-[#6b6b8a]">Sélectionnez une promotion pour afficher le palmarès</p>
            <p className="text-[10px] font-mono text-[#6b6b8a] mt-1">Le palmarès affiche le classement des étudiants par moyenne</p>
          </div>
        )}
      </div>
    )
  }

  // ========================
  // DOCUMENTS VIEW
  // ========================
  const DocumentsView = () => {
    const [documents, setDocuments] = useState<Document[]>([])
    const [docLoading, setDocLoading] = useState(true)

    const fetchDocs = useCallback(async () => {
      setDocLoading(true)
      try {
        const params = new URLSearchParams()
        if (docFilterStudent) params.set('etudiantId', docFilterStudent)
        if (docFilterType) params.set('type', docFilterType)
        setDocuments(await api.get(`/api/documents?${params.toString()}`))
      } catch { toast.error('Erreur de chargement') }
      finally { setDocLoading(false) }
    }, [docFilterStudent, docFilterType])

    useEffect(() => { fetchDocs() }, [fetchDocs])

    const checklistStudent = docFilterStudent ? students.find(s => s.id === docFilterStudent) : null
    const studentDocs = checklistStudent ? documents.filter(d => d.etudiantId === checklistStudent.id) : []
    const requiredDocs = ['Acte de naissance', 'Relevé de notes', 'Diplôme', 'Photo']
    const presentTypes = new Set(studentDocs.map(d => d.type))
    const checklistPct = requiredDocs.length > 0 ? Math.round((requiredDocs.filter(r => presentTypes.has(r)).length / requiredDocs.length) * 100) : 0

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select value={docFilterStudent} onChange={e => setDocFilterStudent(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="">Tous les étudiants</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.nom} {s.prenom}</option>)}
            </select>
            <select value={docFilterType} onChange={e => setDocFilterType(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="">Tous les types</option>
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={() => setShowDocumentForm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>

        {/* Dossier Checklist */}
        {checklistStudent && (
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-mono text-[#e0e0e6] flex items-center gap-2"><Shield className="w-4 h-4 text-[#00d4ff]" /> Checklist — {checklistStudent.nom} {checklistStudent.prenom}</h3>
              <span className={`text-xs font-mono font-bold ${checklistPct === 100 ? 'text-[#00ff88]' : checklistPct >= 50 ? 'text-[#ffaa00]' : 'text-[#ff4444]'}`}>{checklistPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1a1a2e] overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${checklistPct}%`, background: checklistPct === 100 ? '#00ff88' : checklistPct >= 50 ? '#ffaa00' : '#ff4444' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {requiredDocs.map(dt => {
                const present = presentTypes.has(dt)
                return (
                  <div key={dt} className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${present ? 'bg-[#00ff88]/5 border-[#00ff88]/20' : 'bg-[#ff4444]/5 border-[#ff4444]/20'}`}>
                    <span className={present ? 'text-[#00ff88]' : 'text-[#ff4444]'}>{getDocTypeIcon(dt)}</span>
                    <span className={`text-xs font-mono ${present ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{dt}</span>
                    {present ? <CheckCircle className="w-3.5 h-3.5 text-[#00ff88] ml-auto" /> : <XCircle className="w-3.5 h-3.5 text-[#ff4444] ml-auto" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {docLoading ? (
          <div className="space-y-2">{[0,1,2].map(i => <SkeletonRow key={i} />)}</div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📁</div>
            <p className="text-sm font-mono text-[#6b6b8a]">Aucun document</p>
            <p className="text-[10px] font-mono text-[#6b6b8a] mt-1">Ajoutez des documents pour compléter les dossiers étudiants</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map(doc => (
              <div key={doc.id} className="p-3 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] flex items-start gap-3">
                <span className="text-[#6b6b8a] mt-0.5">{getDocTypeIcon(doc.type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-[#e0e0e6] truncate">{doc.titre}</p>
                  <p className="text-[10px] font-mono text-[#00ff88]">{doc.type}</p>
                  {doc.student && <p className="text-[10px] font-mono text-[#6b6b8a]">{doc.student.matricule} — {doc.student.nom}</p>}
                </div>
                <button onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-[#6b6b8a] hover:text-[#ff4444] transition-colors flex-shrink-0 focus-ring"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ========================
  // HANDLERS
  // ========================
  const handleSaveStudent = async (data: Record<string, unknown>) => {
    try {
      if (editingStudent) {
        await api.put(`/api/students/${editingStudent.id}`, data)
        toast.success('Étudiant modifié')
      } else {
        await api.post('/api/students', data)
        toast.success('Étudiant créé')
      }
      setShowStudentForm(false); setEditingStudent(null)
      await refreshStudents(); await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveFiliere = async (data: Record<string, unknown>) => {
    try {
      await api.post('/api/filieres', data)
      toast.success('Filière créée')
      setShowFiliereForm(false); setEditingFiliere(null)
      setFilieres(await api.get('/api/filieres'))
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveFiliereEdit = async (data: Record<string, unknown>) => {
    if (!editingFiliere) return
    try {
      await api.put(`/api/filieres/${editingFiliere.id}`, data)
      toast.success('Filière modifiée')
      setShowFiliereForm(false); setEditingFiliere(null)
      setFilieres(await api.get('/api/filieres'))
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSavePromotion = async (data: Record<string, unknown>) => {
    try {
      await api.post('/api/promotions', data)
      toast.success('Promotion créée')
      setShowPromotionForm(false)
      await refreshPromotions(); await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveInscription = async (data: Record<string, unknown>) => {
    try {
      await api.post('/api/inscriptions', data)
      toast.success('Étudiant inscrit')
      setShowInscriptionForm(false)
      await refreshSelectedPromotion(); await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveMatiere = async (data: Record<string, unknown>) => {
    try {
      if (editingMatiere) {
        await api.put(`/api/matieres/${editingMatiere.id}`, data)
        toast.success('Matière modifiée')
      } else {
        await api.post('/api/matieres', data)
        toast.success('Matière créée')
      }
      setShowMatiereForm(false); setEditingMatiere(null)
      await refreshSelectedPromotion()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveNote = async (inscriptionId: string, matiereId: string, vals: { noteCC: string; noteExam: string; noteTP: string }) => {
    try {
      await api.post('/api/notes', {
        inscriptionId, matiereId,
        noteCC: vals.noteCC ? parseFloat(vals.noteCC) : null,
        noteExam: vals.noteExam ? parseFloat(vals.noteExam) : null,
        noteTP: vals.noteTP ? parseFloat(vals.noteTP) : null,
      })
      toast.success('Note enregistrée')
      await refreshSelectedPromotion()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleCloturer = async () => {
    if (!selectedPromotion) return
    try {
      await api.post(`/api/promotions/${selectedPromotion.id}/cloturer`)
      toast.success('Promotion clôturée')
      setShowClotureConfirm(false)
      await refreshSelectedPromotion(); await refreshPromotions(); await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleUpdateInscriptionDossier = async (ins: Inscription) => {
    const statuses = ['Complet', 'Incomplet', 'En attente', 'Validé', 'Rejeté']
    const currentIdx = statuses.indexOf(ins.statutDossier || 'Incomplet')
    const nextDossier = statuses[(currentIdx + 1) % statuses.length]
    try {
      await api.put(`/api/inscriptions/${ins.id}`, {
        statutDossier: nextDossier, statut: ins.statut || 'Actif',
        redoublant: ins.redoublant, numeroDossier: ins.numeroDossier,
      })
      toast.success(`Dossier → ${nextDossier}`)
      await refreshSelectedPromotion(); await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleDeleteInscription = async (id: string) => {
    try { await api.del(`/api/inscriptions/${id}`); toast.success('Inscription supprimée'); await refreshSelectedPromotion(); await refreshStats() } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }
  const handleDeleteMatiere = async (id: string) => {
    try { await api.del(`/api/matieres/${id}`); toast.success('Matière supprimée'); await refreshSelectedPromotion() } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }
  const handleDeleteDocument = async (id: string) => {
    try { await api.del(`/api/documents/${id}`); toast.success('Document supprimé'); await refreshSelectedStudent(); await refreshStats() } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) return
    try {
      if (showDeleteConfirm.type === 'student') {
        await api.del(`/api/students/${showDeleteConfirm.id}`); setSelectedStudent(null); await refreshStudents()
      } else if (showDeleteConfirm.type === 'filiere') {
        await api.del(`/api/filieres/${showDeleteConfirm.id}`); setFilieres(await api.get('/api/filieres'))
      } else if (showDeleteConfirm.type === 'promotion') {
        await api.del(`/api/promotions/${showDeleteConfirm.id}`); setSelectedPromotion(null); await refreshPromotions()
      }
      toast.success('Supprimé avec succès'); setShowDeleteConfirm(null); await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveDocument = async (data: Record<string, unknown>) => {
    try { await api.post('/api/documents', data); toast.success('Document ajouté'); setShowDocumentForm(false); await refreshSelectedStudent(); await refreshStats() } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  // ========================
  // DIALOGS
  // ========================

  // Student Form Dialog with accordion sections
  const StudentFormDialog = () => {
    const [form, setForm] = useState<Record<string, string>>({
      matricule: editingStudent?.matricule || '', nom: editingStudent?.nom || '', prenom: editingStudent?.prenom || '',
      dateNaissance: editingStudent?.dateNaissance || '', lieuNaissance: editingStudent?.lieuNaissance || '',
      sexe: editingStudent?.sexe || '', nationalite: editingStudent?.nationalite || 'Gabonaise',
      photo: editingStudent?.photo || '', telephone: editingStudent?.telephone || '', email: editingStudent?.email || '', adresse: editingStudent?.adresse || '',
      nomPere: editingStudent?.nomPere || '', nomMere: editingStudent?.nomMere || '',
      telephonePere: editingStudent?.telephonePere || '', telephoneMere: editingStudent?.telephoneMere || '',
      adresseParents: editingStudent?.adresseParents || '', personneContact: editingStudent?.personneContact || '',
      telephoneContact: editingStudent?.telephoneContact || '', lienParente: editingStudent?.lienParente || '',
      etablissementOrigine: editingStudent?.etablissementOrigine || '', diplomeOrigine: editingStudent?.diplomeOrigine || '',
      anneeObtentionDiplome: editingStudent?.anneeObtentionDiplome || '', bourse: editingStudent?.bourse || '', chambre: editingStudent?.chambre || '',
    })
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({ identite: true, photo: !!editingStudent?.photo, contact: false, parents: false, academique: false })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [uploading, setUploading] = useState(false)

    // Auto-save draft to localStorage
    useEffect(() => {
      if (!editingStudent) {
        const saved = localStorage.getItem('cuk_student_draft')
        if (saved) { try { setForm(JSON.parse(saved)) } catch { /* */ } }
      }
    }, [])

    useEffect(() => {
      if (!editingStudent) localStorage.setItem('cuk_student_draft', JSON.stringify(form))
    }, [form, editingStudent])

    const toggleSection = (s: string) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }))

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return
      setUploading(true)
      try {
        const fd = new FormData(); fd.append('file', file); fd.append('subfolder', 'photos')
        const data = await (await fetch('/api/upload', { method: 'POST', body: fd })).json()
        if (data.error) throw new Error(data.error)
        setForm({ ...form, photo: data.url })
        toast.success('Photo téléchargée')
      } catch { toast.error('Erreur de téléchargement de la photo') }
      finally { setUploading(false) }
    }

    const sections = [
      { key: 'identite', label: 'Identité', icon: Users, fields: [
        { key: 'matricule', label: 'Matricule *', required: true },
        { key: 'nom', label: 'Nom *', required: true },
        { key: 'prenom', label: 'Prénom *', required: true },
        { key: 'dateNaissance', label: 'Date de naissance' },
        { key: 'lieuNaissance', label: 'Lieu de naissance' },
        { key: 'sexe', label: 'Sexe', type: 'select', options: ['', 'Masculin', 'Féminin'] },
        { key: 'nationalite', label: 'Nationalité' },
      ]},
      { key: 'photo', label: 'Photo', icon: ImageIcon, fields: [
        { key: '_photo_upload', label: 'Photo de l\'étudiant', type: 'photo' },
      ]},
      { key: 'contact', label: 'Contact', icon: FileText, fields: [
        { key: 'telephone', label: 'Téléphone' }, { key: 'email', label: 'Email' }, { key: 'adresse', label: 'Adresse' },
      ]},
      { key: 'parents', label: 'Parents', icon: Shield, fields: [
        { key: 'nomPere', label: 'Nom du père' }, { key: 'nomMere', label: 'Nom de la mère' },
        { key: 'telephonePere', label: 'Tél. père' }, { key: 'telephoneMere', label: 'Tél. mère' },
        { key: 'adresseParents', label: 'Adresse parents' }, { key: 'personneContact', label: 'Personne à contacter' },
        { key: 'telephoneContact', label: 'Tél. contact' }, { key: 'lienParente', label: 'Lien de parenté' },
      ]},
      { key: 'academique', label: 'Académique', icon: GraduationCap, fields: [
        { key: 'etablissementOrigine', label: 'Établissement d\'origine' }, { key: 'diplomeOrigine', label: 'Diplôme d\'origine' },
        { key: 'anneeObtentionDiplome', label: 'Année d\'obtention' }, { key: 'bourse', label: 'Bourse' }, { key: 'chambre', label: 'Chambre' },
      ]},
    ]

    // Form progress
    const filledFields = Object.values(form).filter(v => v.trim() !== '').length
    const totalFields = Object.keys(form).length
    const progressPct = Math.round((filledFields / totalFields) * 100)

    const validate = () => {
      const errs: Record<string, string> = {}
      if (!form.matricule.trim()) errs.matricule = 'Le matricule est obligatoire'
      if (!form.nom.trim()) errs.nom = 'Le nom est obligatoire'
      if (!form.prenom.trim()) errs.prenom = 'Le prénom est obligatoire'
      setErrors(errs)
      return Object.keys(errs).length === 0
    }

    return (
      <DialogOverlay onClose={() => { setShowStudentForm(false); setEditingStudent(null); localStorage.removeItem('cuk_student_draft') }} title={editingStudent ? 'Modifier l\'étudiant' : 'Nouvel étudiant'} wide>
        {/* Form progress */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] font-mono mb-1">
            <span className="text-[#6b6b8a]">Progression du formulaire</span>
            <span className="text-[#e0e0e6]">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#1a1a2e] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: progressPct >= 80 ? '#00ff88' : progressPct >= 50 ? '#ffaa00' : '#ff4444' }} />
          </div>
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
          {sections.map(section => (
            <div key={section.key} className="rounded-lg border border-[rgba(255,255,255,0.06)] overflow-hidden">
              <button onClick={() => toggleSection(section.key)} className="w-full flex items-center justify-between p-3 bg-[#0a0a0f] hover:bg-[#1a1a2e] transition-colors focus-ring">
                <div className="flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-[#00ff88]" />
                  <span className="text-xs font-mono text-[#e0e0e6]">{section.label}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-[#6b6b8a] transition-transform ${openSections[section.key] ? 'rotate-180' : ''}`} />
              </button>
              {openSections[section.key] && (
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {section.fields.map(f => (
                    <div key={f.key} className={f.type === 'photo' ? 'sm:col-span-2' : ''}>
                      <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">{f.label}</label>
                      {f.type === 'photo' ? (
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-xl border border-[rgba(255,255,255,0.1)] overflow-hidden flex items-center justify-center bg-[#0a0a0f] flex-shrink-0">
                            {form.photo ? (
                              <img src={form.photo} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-[#6b6b8a] opacity-30" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 cursor-pointer transition-colors inline-flex items-center gap-1 btn-micro focus-ring">
                              <Upload className="w-3 h-3" /> {uploading ? 'Téléchargement...' : 'Télécharger'}
                              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                            {form.photo && (
                              <button onClick={() => setForm({ ...form, photo: '' })} className="px-3 py-1 text-[10px] font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors btn-micro focus-ring">
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      ) : f.type === 'select' ? (
                        <select value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
                          {f.options?.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                        </select>
                      ) : (
                        <input value={form[f.key] || ''} onChange={e => { setForm({ ...form, [f.key]: e.target.value }); if (errors[f.key]) setErrors({ ...errors, [f.key]: '' }) }} className={`w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring ${errors[f.key] ? 'border-[#ff4444]' : ''}`} />
                      )}
                      {errors[f.key] && <p className="text-[10px] font-mono text-[#ff4444] mt-1">{errors[f.key]}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => { setShowStudentForm(false); setEditingStudent(null); localStorage.removeItem('cuk_student_draft') }} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">Annuler</button>
          <button onClick={() => { if (validate()) handleSaveStudent(form) }} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
            <Save className="w-3 h-3" /> {editingStudent ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </DialogOverlay>
    )
  }

  // Filiere Form Dialog
  const FiliereFormDialog = () => {
    const [form, setForm] = useState({ code: editingFiliere?.code || '', nom: editingFiliere?.nom || '', description: editingFiliere?.description || '', niveau: editingFiliere?.niveau || '', responsable: editingFiliere?.responsable || '' })
    const [fErrors, setFErrors] = useState<Record<string, string>>({})
    const isEditing = !!editingFiliere
    return (
      <DialogOverlay onClose={() => { setShowFiliereForm(false); setEditingFiliere(null) }} title={isEditing ? 'Modifier la filière' : 'Nouvelle filière'}>
        <div className="space-y-3">
          {[{ key: 'code', label: 'Code *', required: true }, { key: 'nom', label: 'Nom *', required: true }, { key: 'description', label: 'Description' }, { key: 'niveau', label: 'Niveau', type: 'select', options: ['', 'Licence', 'Master', 'Licence & Master'] }, { key: 'responsable', label: 'Responsable' }].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">{f.label}</label>
              {f.type === 'select' ? (
                <select value={form[f.key as keyof typeof form]} onChange={e => { setForm({ ...form, [f.key]: e.target.value }); if (fErrors[f.key]) setFErrors({ ...fErrors, [f.key]: '' }) }} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
                  {f.options?.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              ) : (
                <input value={form[f.key as keyof typeof form]} onChange={e => { setForm({ ...form, [f.key]: e.target.value }); if (fErrors[f.key]) setFErrors({ ...fErrors, [f.key]: '' }) }} className={`w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring ${fErrors[f.key] ? 'border-[#ff4444]' : ''}`} />
              )}
              {fErrors[f.key] && <p className="text-[10px] font-mono text-[#ff4444] mt-1">{fErrors[f.key]}</p>}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => { setShowFiliereForm(false); setEditingFiliere(null) }} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">Annuler</button>
          <button onClick={() => {
            const errs: Record<string, string> = {}
            if (!form.code.trim()) errs.code = 'Le code est obligatoire'
            if (!form.nom.trim()) errs.nom = 'Le nom est obligatoire'
            setFErrors(errs)
            if (Object.keys(errs).length > 0) return
            if (isEditing && editingFiliere) {
              handleSaveFiliereEdit(form)
            } else {
              handleSaveFiliere(form)
            }
          }} disabled={!form.code || !form.nom} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1 btn-micro focus-ring">
            <Save className="w-3 h-3" /> {isEditing ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </DialogOverlay>
    )
  }

  // Promotion Form Dialog
  const PromotionFormDialog = () => {
    const [form, setForm] = useState({ filiereId: '', anneeScolaire: '2024-2025', niveau: 'L1' })
    return (
      <DialogOverlay onClose={() => setShowPromotionForm(false)} title="Nouvelle promotion">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Filière *</label>
            <select value={form.filiereId} onChange={e => setForm({ ...form, filiereId: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="">Sélectionner</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Année scolaire *</label>
            <input value={form.anneeScolaire} onChange={e => setForm({ ...form, anneeScolaire: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Niveau *</label>
            <select value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              {niveauOrder.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setShowPromotionForm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">Annuler</button>
          <button onClick={() => handleSavePromotion(form)} disabled={!form.filiereId || !form.anneeScolaire || !form.niveau} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1 btn-micro focus-ring">
            <Save className="w-3 h-3" /> Créer
          </button>
        </div>
      </DialogOverlay>
    )
  }

  // Inscription Form Dialog
  const InscriptionFormDialog = () => {
    const [form, setForm] = useState({ studentId: '', statutDossier: 'Incomplet', redoublant: false, numeroDossier: '' })
    const [studentSearch, setStudentSearch] = useState('')
    if (!selectedPromotion) return null
    const availableStudents = students.filter(s => !selectedPromotion.inscriptions?.some(ins => ins.studentId === s.id))
    const filteredAvail = studentSearch ? availableStudents.filter(s => `${s.nom} ${s.prenom} ${s.matricule}`.toLowerCase().includes(studentSearch.toLowerCase())) : availableStudents

    return (
      <DialogOverlay onClose={() => setShowInscriptionForm(false)} title="Inscrire un étudiant">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Étudiant *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b6b8a]" />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Rechercher un étudiant..." className="w-full pl-9 pr-3 py-2 mb-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring" />
            </div>
            <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring" size={5}>
              {filteredAvail.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.nom} {s.prenom}</option>)}
            </select>
            {availableStudents.length === 0 && <p className="text-[10px] font-mono text-[#ffaa00] mt-1">Tous les étudiants sont déjà inscrits ou aucun n&apos;existe</p>}
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">N° dossier</label>
            <input value={form.numeroDossier} onChange={e => setForm({ ...form, numeroDossier: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Statut du dossier</label>
            <select value={form.statutDossier} onChange={e => setForm({ ...form, statutDossier: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              {['Complet', 'Incomplet', 'En attente', 'Validé', 'Rejeté'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.redoublant} onChange={e => setForm({ ...form, redoublant: e.target.checked })} className="rounded" />
            <label className="text-xs font-mono text-[#e0e0e6]">Redoublant</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setShowInscriptionForm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">Annuler</button>
          <button onClick={() => handleSaveInscription({ ...form, promotionId: selectedPromotion!.id })} disabled={!form.studentId} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1 btn-micro focus-ring">
            <UserPlus className="w-3 h-3" /> Inscrire
          </button>
        </div>
      </DialogOverlay>
    )
  }

  // Matiere Form Dialog
  const MatiereFormDialog = () => {
    const [form, setForm] = useState({ code: editingMatiere?.code || '', nom: editingMatiere?.nom || '', coefficient: editingMatiere?.coefficient?.toString() || '1', semestre: editingMatiere?.semestre?.toString() || '1' })
    if (!selectedPromotion) return null
    return (
      <DialogOverlay onClose={() => { setShowMatiereForm(false); setEditingMatiere(null) }} title={editingMatiere ? 'Modifier la matière' : 'Nouvelle matière'}>
        <div className="space-y-3">
          {[{ key: 'code', label: 'Code *' }, { key: 'nom', label: 'Nom *' }, { key: 'coefficient', label: 'Coefficient', type: 'number' }].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">{f.label}</label>
              <input type={f.type || 'text'} value={form[f.key as keyof typeof form]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring" />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Semestre</label>
            <select value={form.semestre} onChange={e => setForm({ ...form, semestre: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              <option value="1">Semestre 1</option><option value="2">Semestre 2</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => { setShowMatiereForm(false); setEditingMatiere(null) }} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">Annuler</button>
          <button onClick={() => handleSaveMatiere({ ...form, coefficient: parseFloat(form.coefficient) || 1, semestre: parseInt(form.semestre) || 1, filiereId: selectedPromotion!.filiereId, promotionId: selectedPromotion!.id })} disabled={!form.code || !form.nom} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1 btn-micro focus-ring">
            <Save className="w-3 h-3" /> {editingMatiere ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </DialogOverlay>
    )
  }

  // Document Form Dialog
  const DocumentFormDialog = () => {
    const [form, setForm] = useState({ etudiantId: selectedStudent?.id || '', titre: '', type: 'Acte de naissance', fichier: '', tailleFichier: '' })
    const [uploading, setUploading] = useState(false)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return
      setUploading(true)
      try {
        const fd = new FormData(); fd.append('file', file); fd.append('subfolder', 'documents')
        const data = await (await fetch('/api/upload', { method: 'POST', body: fd })).json()
        setForm({ ...form, fichier: data.url, tailleFichier: `${(file.size / 1024).toFixed(1)} KB` })
        toast.success('Fichier téléchargé')
      } catch { toast.error('Erreur de téléchargement') }
      finally { setUploading(false) }
    }
    return (
      <DialogOverlay onClose={() => setShowDocumentForm(false)} title="Ajouter un document">
        <div className="space-y-3">
          {!selectedStudent && (
            <div>
              <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Étudiant *</label>
              <select value={form.etudiantId} onChange={e => setForm({ ...form, etudiantId: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
                <option value="">Sélectionner</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.nom} {s.prenom}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Titre *</label>
            <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] focus-ring">
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Fichier</label>
            <label className="px-4 py-2 text-xs font-mono rounded-lg bg-[#1a1a2e] text-[#6b6b8a] border border-[rgba(255,255,255,0.06)] hover:text-[#e0e0e6] cursor-pointer transition-colors inline-flex items-center gap-1 focus-ring">
              <Upload className="w-3 h-3" /> {uploading ? 'Téléchargement...' : 'Choisir'}
              <input type="file" onChange={handleFileUpload} className="hidden" multiple />
            </label>
            {form.fichier && <span className="text-[10px] font-mono text-[#00ff88] ml-2">✓ Fichier attaché</span>}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setShowDocumentForm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">Annuler</button>
          <button onClick={() => handleSaveDocument(form)} disabled={!form.etudiantId || !form.titre || !form.fichier} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1 btn-micro focus-ring">
            <Save className="w-3 h-3" /> Ajouter
          </button>
        </div>
      </DialogOverlay>
    )
  }

  // Inscription Detail Dialog
  const InscriptionDetailDialog = () => {
    if (!showInscriptionDetail) return null
    const ins = showInscriptionDetail
    const notes = ins.notes || []
    const s1Notes = notes.filter(n => n.matiere?.semestre === 1)
    const s2Notes = notes.filter(n => n.matiere?.semestre === 2)
    return (
      <DialogOverlay onClose={() => setShowInscriptionDetail(null)} title={`Détail inscription — ${ins.student?.nom} ${ins.student?.prenom}`}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {dossierBadge(ins.statutDossier)}
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#1a1a2e] text-[#e0e0e6] border border-[rgba(255,255,255,0.06)]">{ins.statut}</span>
            {ins.redoublant && <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/20">Redoublant</span>}
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-xs font-mono text-[#6b6b8a]">Aucune note saisie</p>
              <p className="text-[10px] font-mono text-[#6b6b8a]">Les notes apparaîtront ici une fois saisies</p>
            </div>
          ) : (
            <>
              {s1Notes.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono text-[#00d4ff] mb-2">Semestre 1</h4>
                  <table className="w-full text-xs font-mono">
                    <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
                      <th className="py-1 px-2 text-left">Matière</th><th className="py-1 px-2 text-center">CC</th><th className="py-1 px-2 text-center">Exam</th><th className="py-1 px-2 text-center">TP</th><th className="py-1 px-2 text-center">Moy.</th>
                    </tr></thead>
                    <tbody>
                      {s1Notes.map(n => (
                        <tr key={n.id} className="border-b border-[rgba(255,255,255,0.03)]">
                          <td className="py-1 px-2 text-[#e0e0e6]">{n.matiere?.nom} <span className="text-[#6b6b8a]">({n.matiere?.coefficient})</span></td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteCC ?? '—'}</td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteExam ?? '—'}</td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteTP ?? '—'}</td>
                          <td className="py-1 px-2 text-center font-bold text-[#00ff88]">{n.moyenne?.toFixed(2) ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {s2Notes.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono text-[#c084fc] mb-2">Semestre 2</h4>
                  <table className="w-full text-xs font-mono">
                    <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
                      <th className="py-1 px-2 text-left">Matière</th><th className="py-1 px-2 text-center">CC</th><th className="py-1 px-2 text-center">Exam</th><th className="py-1 px-2 text-center">TP</th><th className="py-1 px-2 text-center">Moy.</th>
                    </tr></thead>
                    <tbody>
                      {s2Notes.map(n => (
                        <tr key={n.id} className="border-b border-[rgba(255,255,255,0.03)]">
                          <td className="py-1 px-2 text-[#e0e0e6]">{n.matiere?.nom} <span className="text-[#6b6b8a]">({n.matiere?.coefficient})</span></td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteCC ?? '—'}</td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteExam ?? '—'}</td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteTP ?? '—'}</td>
                          <td className="py-1 px-2 text-center font-bold text-[#00ff88]">{n.moyenne?.toFixed(2) ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </DialogOverlay>
    )
  }

  // ========================
  // RENDER
  // ========================
  return (
    <div className="min-h-screen flex bg-[#0a0a0f] dot-grid-bg">
      {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 overflow-auto scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div key={view + (selectedStudent?.id || '') + (selectedPromotion?.id || '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {view === 'dashboard' && <DashboardView />}
              {view === 'students' && <StudentsView />}
              {view === 'promotions' && <PromotionsView />}
              {view === 'filieres' && <FilieresView />}
              {view === 'palmares' && <PalmaresView />}
              {view === 'documents' && <DocumentsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {showStudentForm && <StudentFormDialog />}
        {showFiliereForm && <FiliereFormDialog />}
        {showPromotionForm && <PromotionFormDialog />}
        {showInscriptionForm && <InscriptionFormDialog />}
        {showMatiereForm && <MatiereFormDialog />}
        {showDocumentForm && <DocumentFormDialog />}
        {showInscriptionDetail && <InscriptionDetailDialog />}
        {showCommandPalette && <CommandPalette />}
        {showClotureConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowClotureConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md p-6 rounded-xl bg-[#12121a] border-2 border-[#ff4444]/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-[#ff4444]/10 animate-pulse"><AlertTriangle className="w-6 h-6 text-[#ff4444]" /></div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-[#ff4444]">⚠️ CLÔTURER DÉFINITIVEMENT</h3>
                  <p className="text-[10px] font-mono text-[#6b6b8a]">Action irréversible</p>
                </div>
              </div>
              <p className="text-xs font-mono text-[#e0e0e6] mb-2">Cette action est permanente et ne peut PAS être annulée. Après clôture :</p>
              <ul className="text-xs font-mono text-[#6b6b8a] list-disc list-inside mb-4 space-y-1">
                <li>Aucune modification de notes ne sera possible</li>
                <li>Aucune inscription ou désinscription</li>
                <li>Aucune modification de matières</li>
                <li>Toutes les données seront verrouillées définitivement</li>
              </ul>
              <div className="p-3 rounded-lg bg-[#ff4444]/5 border border-[#ff4444]/20 mb-4">
                <p className="text-[10px] font-mono text-[#ff4444]">🔒 En cliquant sur &quot;Clôturer définitivement&quot;, vous confirmez que toutes les notes ont été saisies et vérifiées.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowClotureConfirm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">Annuler</button>
                <button onClick={handleCloturer} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#ff4444] text-white hover:bg-[#ff4444]/80 transition-colors flex items-center gap-1 btn-micro focus-ring">
                  <Lock className="w-3 h-3" /> Clôturer définitivement
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md p-6 rounded-xl bg-[#12121a] border border-[#ff4444]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#ff4444]/10"><Trash2 className="w-5 h-5 text-[#ff4444]" /></div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-[#ff4444]">Confirmer la suppression</h3>
                  <p className="text-xs font-mono text-[#6b6b8a]">{showDeleteConfirm.name}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors focus-ring">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center gap-1 btn-micro focus-ring">
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sonner Toaster */}
    </div>
  )
}
