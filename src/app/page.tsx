'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, GraduationCap, Trophy, FileText,
  Plus, Search, Edit3, Trash2, X, ChevronRight, Lock,
  AlertTriangle, CheckCircle2, Clock, XCircle, Eye,
  BookOpen, Calendar, Save, RefreshCw, Upload, FileUp,
  UserPlus, FolderOpen, Award, TrendingUp, BarChart3,
  Menu, ChevronDown, Filter, ArrowLeft, Medal, Shield,
  Printer, CheckCircle, AlertCircle, Info, Download
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

interface Stats {
  totalStudents: number; totalPromotions: number
  activePromotions: number; closedPromotions: number
  totalInscriptions: number; totalFilieres: number
  dossierByStatus: { statut: string; count: number }[]
  filiereCounts: Record<string, number>
  recentInscriptions: Inscription[]
  tauxReussite: number
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
const dossierBadge = (statut: string | null | undefined) => {
  const s = statut || 'Incomplet'
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'Complet': { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', icon: <CheckCircle2 className="w-3 h-3" /> },
    'Incomplet': { bg: 'bg-orange-500/15 border-orange-500/30', text: 'text-orange-400', icon: <AlertTriangle className="w-3 h-3" /> },
    'En attente': { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', icon: <Clock className="w-3 h-3" /> },
    'Validé': { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400', icon: <CheckCircle className="w-3 h-3" /> },
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
    'Bien': { bg: 'bg-blue-500/15 border-blue-500/30', text: 'text-blue-400' },
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
  const [showNoteEntry, setShowNoteEntry] = useState(false)
  const [showDocumentForm, setShowDocumentForm] = useState(false)
  const [showClotureConfirm, setShowClotureConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null)
  const [showInscriptionDetail, setShowInscriptionDetail] = useState<Inscription | null>(null)

  // Editing
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editingMatiere, setEditingMatiere] = useState<Matiere | null>(null)
  const [selectedMatiereForNotes, setSelectedMatiereForNotes] = useState<Matiere | null>(null)

  // Search & filters
  const [studentSearch, setStudentSearch] = useState('')
  const [promoFilterAnnee, setPromoFilterAnnee] = useState('')
  const [promoFilterFiliere, setPromoFilterFiliere] = useState('')
  const [promoFilterStatut, setPromoFilterStatut] = useState('')
  const [palmaresPromotionId, setPalmaresPromotionId] = useState('')
  const [docFilterStudent, setDocFilterStudent] = useState('')
  const [docFilterType, setDocFilterType] = useState('')

  // Promotion detail tab
  const [promoTab, setPromoTab] = useState('inscriptions')

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

  const refreshPromotions = async () => {
    try {
      const p = await api.get('/api/promotions')
      setPromotions(p)
    } catch { /* ignore */ }
  }

  const refreshStudents = async () => {
    try {
      const s = await api.get('/api/students')
      setStudents(s)
    } catch { /* ignore */ }
  }

  const refreshStats = async () => {
    try {
      const st = await api.get('/api/stats')
      setStats(st)
    } catch { /* ignore */ }
  }

  const refreshSelectedPromotion = async () => {
    if (!selectedPromotion) return
    try {
      const p = await api.get(`/api/promotions/${selectedPromotion.id}`)
      setSelectedPromotion(p)
    } catch { /* ignore */ }
  }

  const refreshSelectedStudent = async () => {
    if (!selectedStudent) return
    try {
      const s = await api.get(`/api/students/${selectedStudent.id}`)
      setSelectedStudent(s)
    } catch { /* ignore */ }
  }

  const loadPalmares = async (promotionId: string) => {
    try {
      const data = await api.get(`/api/palmares?promotionId=${promotionId}`)
      setPalmaresData(data)
    } catch (e) { console.error(e); toast.error('Erreur de chargement du palmarès') }
  }

  // Navigation
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'students', label: 'Étudiants', icon: Users },
    { key: 'promotions', label: 'Promotions', icon: GraduationCap },
    { key: 'palmares', label: 'Palmarès', icon: Trophy },
    { key: 'documents', label: 'Documents', icon: FileText },
  ]

  const navigateTo = (key: string) => {
    setView(key)
    setSelectedStudent(null)
    setSelectedPromotion(null)
    setMobileMenuOpen(false)
  }

  const years = Array.from(new Set(promotions.map(p => p.anneeScolaire))).sort().reverse()
  const docTypes = ['Acte de naissance', 'Relevé de notes', 'Diplôme', 'Certificat', 'Photo', 'Autre']

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
            <h1 className="text-sm font-bold text-[#00ff88] neon-text tracking-wider">CUK</h1>
            <p className="text-[10px] text-[#6b6b8a]">Koulamoutou</p>
          </motion.div>
        )}
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.key} onClick={() => navigateTo(item.key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-200 ${view === item.key ? 'bg-[#00ff88]/10 text-[#00ff88] neon-border' : 'text-[#6b6b8a] hover:text-[#e0e0e6] hover:bg-[#1a1a2e]'}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
        {sidebarOpen && (
          <div className="text-[10px] text-[#6b6b8a] font-mono">
            <p>v2.0 — Gestion Étudiants</p>
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
    <header className="h-14 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-4 bg-[#0d0d14]/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-[#6b6b8a] hover:text-[#00ff88]">
          <Menu className="w-5 h-5" />
        </button>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-[#6b6b8a] hover:text-[#00ff88]">
          <Menu className="w-5 h-5" />
        </button>
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
        <button onClick={() => { fetchData(); toast.success('Données actualisées') }} className="p-1.5 rounded-lg text-[#6b6b8a] hover:text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] text-xs font-mono text-[#6b6b8a]">
          <Calendar className="w-3 h-3" />
          <span>2024-2025</span>
        </div>
      </div>
    </header>
  )

  // ========================
  // STAT CARD
  // ========================
  const StatCard = ({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: number | string; color: string; sub?: string }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,255,136,0.2)] transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-[#6b6b8a] mb-1">{label}</p>
          <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
          {sub && <p className="text-[10px] font-mono text-[#6b6b8a] mt-1">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color === 'text-[#00ff88]' ? 'bg-[#00ff88]/10' : color === 'text-[#00d4ff]' ? 'bg-[#00d4ff]/10' : color === 'text-[#ffaa00]' ? 'bg-[#ffaa00]/10' : 'bg-[#ff4444]/10'}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </motion.div>
  )

  // ========================
  // DASHBOARD VIEW
  // ========================
  const DashboardView = () => {
    if (!stats) return <div className="flex items-center justify-center h-64 text-[#6b6b8a] font-mono text-sm">Chargement...</div>

    const dossierStats = stats.dossierByStatus.length > 0 ? stats.dossierByStatus : [
      { statut: 'Complet', count: 0 }, { statut: 'Incomplet', count: 0 },
      { statut: 'En attente', count: 0 }, { statut: 'Validé', count: 0 }, { statut: 'Rejeté', count: 0 },
    ]

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Étudiants inscrits" value={stats.totalStudents} color="text-[#00ff88]" sub={`${stats.totalInscriptions} inscriptions`} />
          <StatCard icon={GraduationCap} label="Promotions actives" value={stats.activePromotions} color="text-[#00d4ff]" sub={`${stats.closedPromotions} clôturées`} />
          <StatCard icon={FolderOpen} label="Dossiers complets" value={stats.dossierByStatus.find(d => d.statut === 'Complet')?.count || 0} color="text-[#ffaa00]" sub="et validés" />
          <StatCard icon={TrendingUp} label="Taux de réussite" value={`${stats.tauxReussite}%`} color="text-[#00ff88]" sub="dossiers traités" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Dossier Status Chart */}
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00d4ff]" /> Statut des dossiers</h3>
            <div className="space-y-3">
              {dossierStats.map(d => {
                const maxCount = Math.max(...dossierStats.map(x => x.count), 1)
                const pct = (d.count / maxCount) * 100
                const colors: Record<string, string> = { 'Complet': '#00ff88', 'Incomplet': '#ff8800', 'En attente': '#ffaa00', 'Validé': '#00d4ff', 'Rejeté': '#ff4444', 'Non défini': '#6b6b8a' }
                return (
                  <div key={d.statut}>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-[#6b6b8a]">{d.statut}</span>
                      <span className="text-[#e0e0e6]">{d.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: colors[d.statut] || '#6b6b8a' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Filiere Distribution */}
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#00ff88]" /> Répartition par filière</h3>
            {Object.keys(stats.filiereCounts).length === 0 ? (
              <p className="text-xs font-mono text-[#6b6b8a]">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.filiereCounts).map(([name, count], i) => {
                  const maxC = Math.max(...Object.values(stats.filiereCounts), 1)
                  const pct = (count / maxC) * 100
                  const colors = ['#00ff88', '#00d4ff', '#ff6b6b', '#ffd93d', '#c084fc']
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-[#6b6b8a]">{name}</span>
                        <span className="text-[#e0e0e6]">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#1a1a2e] overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Inscriptions */}
        <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-[#e0e0e6] flex items-center gap-2"><Clock className="w-4 h-4 text-[#ffaa00]" /> Inscriptions récentes</h3>
            <div className="flex gap-2">
              <button onClick={() => { setShowPromotionForm(true) }} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Promotion
              </button>
              <button onClick={() => { setShowStudentForm(true); setEditingStudent(null) }} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Étudiant
              </button>
            </div>
          </div>
          {stats.recentInscriptions.length === 0 ? (
            <p className="text-xs font-mono text-[#6b6b8a] text-center py-8">Aucune inscription pour le moment</p>
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
    const filtered = students.filter(s =>
      `${s.matricule} ${s.nom} ${s.prenom}`.toLowerCase().includes(studentSearch.toLowerCase())
    )

    if (selectedStudent) return <StudentDetailView />

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6b8a]" />
            <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Rechercher un étudiant..." className="w-full pl-10 pr-4 py-2 rounded-lg terminal-input text-sm font-mono text-[#e0e0e6] bg-[#12121a]" />
          </div>
          <button onClick={() => { setShowStudentForm(true); setEditingStudent(null) }} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouvel étudiant
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-[#6b6b8a] mx-auto mb-4" />
            <p className="text-sm font-mono text-[#6b6b8a]">Aucun étudiant trouvé</p>
            <button onClick={() => { setShowStudentForm(true); setEditingStudent(null) }} className="mt-4 px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors">
              <Plus className="w-3 h-3 inline mr-1" /> Ajouter un étudiant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(student => (
              <motion.div key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,255,136,0.2)] cursor-pointer transition-all duration-300 group" onClick={() => { setSelectedStudent(student); }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] font-mono text-sm font-bold flex-shrink-0">
                    {student.prenom[0]}{student.nom[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-[#e0e0e6] truncate group-hover:text-[#00ff88] transition-colors">{student.nom} {student.prenom}</p>
                    <p className="text-xs font-mono text-[#6b6b8a]">{student.matricule}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6b6b8a] ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
                {student.inscriptions && student.inscriptions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {student.inscriptions.slice(0, 3).map(ins => (
                      <span key={ins.id} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1a1a2e] text-[#6b6b8a] border border-[rgba(255,255,255,0.04)]">
                        {ins.promotion?.filiere?.code} {ins.promotion?.niveau}
                      </span>
                    ))}
                    {student.inscriptions.length > 3 && <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1a1a2e] text-[#6b6b8a]">+{student.inscriptions.length - 3}</span>}
                  </div>
                )}
              </motion.div>
            ))}
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

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedStudent(null)} className="flex items-center gap-2 text-xs font-mono text-[#6b6b8a] hover:text-[#00ff88] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux étudiants
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Student Info */}
          <div className="lg:col-span-1 p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] font-mono text-xl font-bold">
                {s.prenom[0]}{s.nom[0]}
              </div>
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
                  <span className="text-[#e0e0e6]">{v}</span>
                </div>
              ) : null)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingStudent(s); setShowStudentForm(true) }} className="flex-1 px-3 py-2 text-xs font-mono rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-colors flex items-center justify-center gap-1">
                <Edit3 className="w-3 h-3" /> Modifier
              </button>
              <button onClick={() => setShowDeleteConfirm({ type: 'student', id: s.id, name: `${s.nom} ${s.prenom}` })} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center justify-center gap-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Academic Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
              <h3 className="text-sm font-mono text-[#e0e0e6] mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-[#00d4ff]" /> Parcours académique</h3>
              {(!s.inscriptions || s.inscriptions.length === 0) ? (
                <p className="text-xs font-mono text-[#6b6b8a] text-center py-4">Aucune inscription</p>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-[rgba(0,255,136,0.2)]" />
                  {s.inscriptions.sort((a, b) => {
                    const ya = a.promotion?.anneeScolaire || ''; const yb = b.promotion?.anneeScolaire || ''
                    return ya.localeCompare(yb)
                  }).map(ins => (
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
                        <div className="flex gap-2">
                          <button onClick={() => setShowInscriptionDetail(ins)} className="px-2 py-1 text-[10px] font-mono rounded bg-[#00d4ff]/10 text-[#00d4ff] hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Détails
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-mono text-[#e0e0e6] flex items-center gap-2"><FileText className="w-4 h-4 text-[#ffaa00]" /> Documents</h3>
                <button onClick={() => setShowDocumentForm(true)} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>
              {(!s.documents || s.documents.length === 0) ? (
                <p className="text-xs font-mono text-[#6b6b8a] text-center py-4">Aucun document</p>
              ) : (
                <div className="space-y-2">
                  {s.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.04)]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#6b6b8a]" />
                        <div>
                          <p className="text-xs font-mono text-[#e0e0e6]">{doc.titre}</p>
                          <p className="text-[10px] font-mono text-[#6b6b8a]">{doc.type}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-[#6b6b8a] hover:text-[#ff4444] transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
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
            <select value={promoFilterAnnee} onChange={e => setPromoFilterAnnee(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              <option value="">Toutes les années</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={promoFilterFiliere} onChange={e => setPromoFilterFiliere(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              <option value="">Toutes les filières</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            <select value={promoFilterStatut} onChange={e => setPromoFilterStatut(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              <option value="">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="Clôturée">Clôturée</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFiliereForm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Filière
            </button>
            <button onClick={() => setShowPromotionForm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> Promotion
            </button>
          </div>
        </div>

        {/* Filières list */}
        {filieres.length > 0 && (
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#00d4ff]" /> Filières</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filieres.map(f => (
                <div key={f.id} className="p-3 rounded-lg bg-[#1a1a2e] border border-[rgba(255,255,255,0.04)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-mono text-[#00ff88] font-bold">{f.code}</p>
                      <p className="text-xs font-mono text-[#e0e0e6]">{f.nom}</p>
                      {f.niveau && <p className="text-[10px] font-mono text-[#6b6b8a]">{f.niveau}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setShowDeleteConfirm({ type: 'filiere', id: f.id, name: f.nom })} className="p-1 text-[#6b6b8a] hover:text-[#ff4444] transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-[#6b6b8a] mx-auto mb-4" />
            <p className="text-sm font-mono text-[#6b6b8a]">Aucune promotion trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(promo => (
              <motion.div key={promo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,255,136,0.2)] cursor-pointer transition-all duration-300 group" onClick={() => setSelectedPromotion(promo)}>
                <div className="flex items-start justify-between mb-2">
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
                <div className="flex gap-3 text-[10px] font-mono text-[#6b6b8a]">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {promo._count?.inscriptions || 0} inscrits</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {promo._count?.matieres || 0} matières</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6b6b8a] absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
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

    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedPromotion(null); setPromoTab('inscriptions') }} className="flex items-center gap-2 text-xs font-mono text-[#6b6b8a] hover:text-[#00ff88] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux promotions
        </button>

        {/* Closed Banner */}
        {isClosed && (
          <div className="p-3 rounded-xl bg-[#ff4444]/5 border border-[#ff4444]/20 flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#ff4444] flex-shrink-0" />
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
                <button onClick={() => setShowClotureConfirm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Clôturer
                </button>
              )}
              {!isClosed && (
                <button onClick={() => setShowDeleteConfirm({ type: 'promotion', id: p.id, name: `${p.filiere?.nom} ${p.niveau}` })} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
          {['inscriptions', 'matieres', 'notes'].map(tab => (
            <button key={tab} onClick={() => setPromoTab(tab)}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-mono transition-all ${promoTab === tab ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20' : 'text-[#6b6b8a] hover:text-[#e0e0e6]'}`}>
              {tab === 'inscriptions' ? 'Inscriptions' : tab === 'matieres' ? 'Matières' : 'Notes'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {promoTab === 'inscriptions' && <PromoInscriptionsTab key="insc" promotion={p} isClosed={isClosed} />}
          {promoTab === 'matieres' && <PromoMatieresTab key="mat" promotion={p} isClosed={isClosed} />}
          {promoTab === 'notes' && <PromoNotesTab key="not" promotion={p} isClosed={isClosed} />}
        </AnimatePresence>
      </div>
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
          <button onClick={() => setShowInscriptionForm(true)} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1">
            <UserPlus className="w-3 h-3" /> Inscrire un étudiant
          </button>
        )}
      </div>
      {(!promotion.inscriptions || promotion.inscriptions.length === 0) ? (
        <p className="text-xs font-mono text-[#6b6b8a] text-center py-8">Aucun étudiant inscrit</p>
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
                      <button onClick={() => setShowInscriptionDetail(ins)} className="p-1 rounded text-[#6b6b8a] hover:text-[#00d4ff] transition-colors"><Eye className="w-3 h-3" /></button>
                      {!isClosed && <button onClick={() => handleUpdateInscriptionDossier(ins)} className="p-1 rounded text-[#6b6b8a] hover:text-[#00ff88] transition-colors"><Edit3 className="w-3 h-3" /></button>}
                      {!isClosed && <button onClick={() => handleDeleteInscription(ins.id)} className="p-1 rounded text-[#6b6b8a] hover:text-[#ff4444] transition-colors"><Trash2 className="w-3 h-3" /></button>}
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
          <button onClick={() => { setEditingMatiere(null); setShowMatiereForm(true) }} className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ajouter une matière
          </button>
        )}
      </div>
      {(!promotion.matieres || promotion.matieres.length === 0) ? (
        <p className="text-xs font-mono text-[#6b6b8a] text-center py-8">Aucune matière</p>
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
                        <button onClick={() => { setEditingMatiere(mat); setShowMatiereForm(true) }} className="p-1 rounded text-[#6b6b8a] hover:text-[#00ff88] transition-colors"><Edit3 className="w-3 h-3" /></button>
                        <button onClick={() => handleDeleteMatiere(mat.id)} className="p-1 rounded text-[#6b6b8a] hover:text-[#ff4444] transition-colors"><Trash2 className="w-3 h-3" /></button>
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
  // PROMO NOTES TAB
  // ========================
  const PromoNotesTab = ({ promotion, isClosed }: { promotion: Promotion; isClosed: boolean }) => {
    const matieres = promotion.matieres || []
    const inscriptions = promotion.inscriptions || []
    const [noteValues, setNoteValues] = useState<Record<string, { noteCC: string; noteExam: string; noteTP: string }>>({})

    const selectedMatiere = selectedMatiereForNotes

    if (matieres.length === 0) return <p className="text-xs font-mono text-[#6b6b8a] text-center py-8">Ajoutez d&apos;abord des matières</p>
    if (inscriptions.length === 0) return <p className="text-xs font-mono text-[#6b6b8a] text-center py-8">Aucun étudiant inscrit</p>

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
        {isClosed && (
          <div className="p-3 rounded-lg bg-[#ff4444]/5 border border-[#ff4444]/10 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#ff4444]" />
            <span className="text-xs font-mono text-[#ff4444]">Notes verrouillées — Année clôturée</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-[#6b6b8a]">Matière :</label>
          <select value={selectedMatiere?.id || ''} onChange={e => {
            const mat = matieres.find(m => m.id === e.target.value) || null
            setSelectedMatiereForNotes(mat)
          }} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
            <option value="">Sélectionner une matière</option>
            {matieres.map(m => <option key={m.id} value={m.id}>S{m.semestre} — {m.code} {m.nom} (Coef: {m.coefficient})</option>)}
          </select>
        </div>

        {selectedMatiere && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
                <th className="py-2 px-3 text-left">Matricule</th><th className="py-2 px-3 text-left">Nom</th>
                <th className="py-2 px-3 text-center">CC (30%)</th><th className="py-2 px-3 text-center">Exam (50%)</th><th className="py-2 px-3 text-center">TP (20%)</th>
                <th className="py-2 px-3 text-center">Moyenne</th><th className="py-2 px-3 text-center">Action</th>
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
                      <td className="py-2 px-3"><input type="number" step="0.01" min="0" max="20" disabled={isClosed} value={vals.noteCC} onChange={e => setNoteValues(v => ({ ...v, [key]: { ...v[key] || { noteCC: '', noteExam: '', noteTP: '' }, noteCC: e.target.value } }))} className="w-16 px-2 py-1 rounded text-center terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] disabled:opacity-50" /></td>
                      <td className="py-2 px-3"><input type="number" step="0.01" min="0" max="20" disabled={isClosed} value={vals.noteExam} onChange={e => setNoteValues(v => ({ ...v, [key]: { ...v[key] || { noteCC: '', noteExam: '', noteTP: '' }, noteExam: e.target.value } }))} className="w-16 px-2 py-1 rounded text-center terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] disabled:opacity-50" /></td>
                      <td className="py-2 px-3"><input type="number" step="0.01" min="0" max="20" disabled={isClosed} value={vals.noteTP} onChange={e => setNoteValues(v => ({ ...v, [key]: { ...v[key] || { noteCC: '', noteExam: '', noteTP: '' }, noteTP: e.target.value } }))} className="w-16 px-2 py-1 rounded text-center terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a] disabled:opacity-50" /></td>
                      <td className="py-2 px-3 text-center"><span className={`font-bold ${existingNote?.moyenne !== null && existingNote?.moyenne !== undefined ? (existingNote.moyenne >= 10 ? 'text-[#00ff88]' : 'text-[#ff4444]') : 'text-[#6b6b8a]'}`}>{existingNote?.moyenne?.toFixed(2) || '-'}</span></td>
                      <td className="py-2 px-3 text-center">
                        {!isClosed && (
                          <button onClick={() => handleSaveNote(ins.id, selectedMatiere.id, vals)} className="px-2 py-1 rounded text-[10px] bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1 mx-auto">
                            <Save className="w-3 h-3" /> Sauver
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    )
  }

  // ========================
  // PALMARES VIEW
  // ========================
  const PalmaresView = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <select value={palmaresPromotionId} onChange={e => { setPalmaresPromotionId(e.target.value); if (e.target.value) loadPalmares(e.target.value) }} className="px-4 py-2 rounded-lg terminal-input text-sm font-mono text-[#e0e0e6] bg-[#12121a] min-w-[300px]">
          <option value="">Sélectionner une promotion</option>
          {promotions.map(p => <option key={p.id} value={p.id}>{p.filiere?.nom} — {p.niveau} ({p.anneeScolaire})</option>)}
        </select>
        {palmaresData && (
          <button className="px-3 py-2 text-xs font-mono rounded-lg bg-[#1a1a2e] text-[#6b6b8a] border border-[rgba(255,255,255,0.06)] hover:text-[#e0e0e6] transition-colors flex items-center gap-1">
            <Printer className="w-3 h-3" /> Imprimer
          </button>
        )}
      </div>

      {palmaresData ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center">
            <h2 className="text-lg font-mono font-bold text-[#00ff88] neon-text">PALMARÈS</h2>
            <p className="text-sm font-mono text-[#e0e0e6]">{palmaresData.promotion.filiere.nom} — {palmaresData.promotion.niveau}</p>
            <p className="text-xs font-mono text-[#6b6b8a]">Année scolaire {palmaresData.promotion.anneeScolaire}</p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center">
              <p className="text-[10px] font-mono text-[#6b6b8a]">Moy. de classe</p>
              <p className="text-lg font-mono font-bold text-[#00ff88]">{palmaresData.statistics.classAvg.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center">
              <p className="text-[10px] font-mono text-[#6b6b8a]">Taux de réussite</p>
              <p className="text-lg font-mono font-bold text-[#00d4ff]">{palmaresData.statistics.passRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center">
              <p className="text-[10px] font-mono text-[#6b6b8a]">Effectif</p>
              <p className="text-lg font-mono font-bold text-[#e0e0e6]">{palmaresData.statistics.totalStudents}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#12121a] border border-[rgba(255,255,255,0.06)] text-center">
              <p className="text-[10px] font-mono text-[#6b6b8a]">Réussis</p>
              <p className="text-lg font-mono font-bold text-[#ffaa00]">{palmaresData.palmares.filter(p => p.moyenneAnnuelle !== null && p.moyenneAnnuelle >= 10).length}</p>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead><tr className="text-[#6b6b8a] border-b border-[rgba(255,255,255,0.06)]">
                <th className="py-2 px-3 text-center">Rang</th><th className="py-2 px-3 text-left">Matricule</th><th className="py-2 px-3 text-left">Nom & Prénom</th>
                <th className="py-2 px-3 text-center">Moy. S1</th><th className="py-2 px-3 text-center">Moy. S2</th><th className="py-2 px-3 text-center">Moy. Annuelle</th>
                <th className="py-2 px-3 text-center">Crédits</th><th className="py-2 px-3 text-center">Mention</th>
              </tr></thead>
              <tbody>
                {palmaresData.palmares.map(entry => {
                  const rankClass = entry.rang === 1 ? 'border-l-2 border-l-[#ffd93d] bg-[#ffd93d]/5' : entry.rang === 2 ? 'border-l-2 border-l-[#c0c0c0] bg-[#c0c0c0]/5' : entry.rang === 3 ? 'border-l-2 border-l-[#cd7f32] bg-[#cd7f32]/5' : ''
                  return (
                    <tr key={entry.inscriptionId} className={`border-b border-[rgba(255,255,255,0.03)] hover:bg-[#1a1a2e]/50 transition-colors ${rankClass}`}>
                      <td className="py-2 px-3 text-center">
                        {entry.rang <= 3 ? (
                          <span className="text-base">{entry.rang === 1 ? '🥇' : entry.rang === 2 ? '🥈' : '🥉'}</span>
                        ) : (
                          <span className="text-[#6b6b8a]">{entry.rang}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#00ff88]">{entry.matricule}</td>
                      <td className="py-2 px-3 text-[#e0e0e6]">{entry.nom} {entry.prenom}{entry.redoublant ? ' (R)' : ''}</td>
                      <td className="py-2 px-3 text-center text-[#e0e0e6]">{entry.moyenneS1?.toFixed(2) || '-'}</td>
                      <td className="py-2 px-3 text-center text-[#e0e0e6]">{entry.moyenneS2?.toFixed(2) || '-'}</td>
                      <td className="py-2 px-3 text-center font-bold text-[#e0e0e6]">{entry.moyenneAnnuelle?.toFixed(2) || '-'}</td>
                      <td className="py-2 px-3 text-center text-[#00d4ff]">{entry.totalCredits}</td>
                      <td className="py-2 px-3 text-center">{mentionBadge(entry.mention)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mention Distribution */}
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00d4ff]" /> Répartition par mention</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(palmaresData.statistics.mentionDistribution).map(([mention, count]) => (
                <div key={mention} className="flex items-center gap-2">{mentionBadge(mention)} <span className="text-xs font-mono text-[#e0e0e6]">× {count}</span></div>
              ))}
            </div>
          </div>
        </div>
      ) : palmaresPromotionId ? (
        <div className="text-center py-16"><RefreshCw className="w-8 h-8 text-[#6b6b8a] mx-auto mb-3 animate-spin" /><p className="text-xs font-mono text-[#6b6b8a]">Chargement du palmarès...</p></div>
      ) : (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-[#6b6b8a] mx-auto mb-4" />
          <p className="text-sm font-mono text-[#6b6b8a]">Sélectionnez une promotion pour afficher le palmarès</p>
        </div>
      )}
    </div>
  )

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
        const data = await api.get(`/api/documents?${params.toString()}`)
        setDocuments(data)
      } catch { toast.error('Erreur de chargement') }
      finally { setDocLoading(false) }
    }, [docFilterStudent, docFilterType])

    useEffect(() => { fetchDocs() }, [fetchDocs])

    // Dossier checklist for selected student
    const checklistStudent = docFilterStudent ? students.find(s => s.id === docFilterStudent) : null
    const studentDocs = checklistStudent ? documents.filter(d => d.etudiantId === checklistStudent.id) : []
    const requiredDocs = ['Acte de naissance', 'Relevé de notes', 'Diplôme', 'Certificat', 'Photo']
    const presentTypes = new Set(studentDocs.map(d => d.type))

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select value={docFilterStudent} onChange={e => setDocFilterStudent(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              <option value="">Tous les étudiants</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.nom} {s.prenom}</option>)}
            </select>
            <select value={docFilterType} onChange={e => setDocFilterType(e.target.value)} className="px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              <option value="">Tous les types</option>
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={() => setShowDocumentForm(true)} className="px-3 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> Ajouter un document
          </button>
        </div>

        {/* Dossier Checklist */}
        {checklistStudent && (
          <div className="p-4 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-mono text-[#e0e0e6] mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-[#00d4ff]" /> Checklist du dossier — {checklistStudent.nom} {checklistStudent.prenom}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {requiredDocs.map(dt => {
                const present = presentTypes.has(dt)
                return (
                  <div key={dt} className={`flex items-center gap-2 p-2 rounded-lg border ${present ? 'bg-[#00ff88]/5 border-[#00ff88]/20' : 'bg-[#ff4444]/5 border-[#ff4444]/20'}`}>
                    {present ? <CheckCircle className="w-4 h-4 text-[#00ff88]" /> : <XCircle className="w-4 h-4 text-[#ff4444]" />}
                    <span className={`text-xs font-mono ${present ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{dt}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Documents List */}
        {docLoading ? (
          <p className="text-xs font-mono text-[#6b6b8a] text-center py-8">Chargement...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-[#6b6b8a] mx-auto mb-4" />
            <p className="text-sm font-mono text-[#6b6b8a]">Aucun document</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map(doc => (
              <div key={doc.id} className="p-3 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] flex items-start gap-3">
                <FileText className="w-8 h-8 text-[#6b6b8a] flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-[#e0e0e6] truncate">{doc.titre}</p>
                  <p className="text-[10px] font-mono text-[#00ff88]">{doc.type}</p>
                  {doc.student && <p className="text-[10px] font-mono text-[#6b6b8a]">{doc.student.matricule} — {doc.student.nom}</p>}
                </div>
                <button onClick={() => handleDeleteDocument(doc.id)} className="p-1 text-[#6b6b8a] hover:text-[#ff4444] transition-colors flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
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
      setShowStudentForm(false)
      setEditingStudent(null)
      await refreshStudents()
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveFiliere = async (data: Record<string, unknown>) => {
    try {
      await api.post('/api/filieres', data)
      toast.success('Filière créée')
      setShowFiliereForm(false)
      const f = await api.get('/api/filieres')
      setFilieres(f)
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSavePromotion = async (data: Record<string, unknown>) => {
    try {
      await api.post('/api/promotions', data)
      toast.success('Promotion créée')
      setShowPromotionForm(false)
      await refreshPromotions()
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveInscription = async (data: Record<string, unknown>) => {
    try {
      await api.post('/api/inscriptions', data)
      toast.success('Étudiant inscrit')
      setShowInscriptionForm(false)
      await refreshSelectedPromotion()
      await refreshStats()
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
      setShowMatiereForm(false)
      setEditingMatiere(null)
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
      await refreshSelectedPromotion()
      await refreshPromotions()
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleUpdateInscriptionDossier = async (ins: Inscription) => {
    const statuses = ['Complet', 'Incomplet', 'En attente', 'Validé', 'Rejeté']
    const studentStatuses = ['Actif', 'Inactif', 'Diplômé', 'Renvoyé', 'Ajourné']
    const currentIdx = statuses.indexOf(ins.statutDossier || 'Incomplet')
    const nextDossier = statuses[(currentIdx + 1) % statuses.length]
    const currentStudentStatus = ins.statut || 'Actif'

    // Simple toggle - cycle through dossier statuses
    try {
      await api.put(`/api/inscriptions/${ins.id}`, {
        statutDossier: nextDossier,
        statut: currentStudentStatus,
        redoublant: ins.redoublant,
        numeroDossier: ins.numeroDossier,
      })
      toast.success(`Dossier → ${nextDossier}`)
      await refreshSelectedPromotion()
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleDeleteInscription = async (id: string) => {
    try {
      await api.del(`/api/inscriptions/${id}`)
      toast.success('Inscription supprimée')
      await refreshSelectedPromotion()
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleDeleteMatiere = async (id: string) => {
    try {
      await api.del(`/api/matieres/${id}`)
      toast.success('Matière supprimée')
      await refreshSelectedPromotion()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      await api.del(`/api/documents/${id}`)
      toast.success('Document supprimé')
      await refreshSelectedStudent()
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) return
    try {
      if (showDeleteConfirm.type === 'student') {
        await api.del(`/api/students/${showDeleteConfirm.id}`)
        setSelectedStudent(null)
        await refreshStudents()
      } else if (showDeleteConfirm.type === 'filiere') {
        await api.del(`/api/filieres/${showDeleteConfirm.id}`)
        const f = await api.get('/api/filieres')
        setFilieres(f)
      } else if (showDeleteConfirm.type === 'promotion') {
        await api.del(`/api/promotions/${showDeleteConfirm.id}`)
        setSelectedPromotion(null)
        await refreshPromotions()
      }
      toast.success('Supprimé avec succès')
      setShowDeleteConfirm(null)
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  const handleSaveDocument = async (data: Record<string, unknown>) => {
    try {
      await api.post('/api/documents', data)
      toast.success('Document ajouté')
      setShowDocumentForm(false)
      await refreshSelectedStudent()
      await refreshStats()
    } catch (e: unknown) { toast.error((e as Error).message || 'Erreur') }
  }

  // ========================
  // DIALOGS
  // ========================

  // Student Form Dialog
  const StudentFormDialog = () => {
    const [form, setForm] = useState<Record<string, string>>({
      matricule: editingStudent?.matricule || '',
      nom: editingStudent?.nom || '',
      prenom: editingStudent?.prenom || '',
      dateNaissance: editingStudent?.dateNaissance || '',
      lieuNaissance: editingStudent?.lieuNaissance || '',
      sexe: editingStudent?.sexe || '',
      nationalite: editingStudent?.nationalite || 'Gabonaise',
      telephone: editingStudent?.telephone || '',
      email: editingStudent?.email || '',
      adresse: editingStudent?.adresse || '',
      nomPere: editingStudent?.nomPere || '',
      nomMere: editingStudent?.nomMere || '',
      telephonePere: editingStudent?.telephonePere || '',
      telephoneMere: editingStudent?.telephoneMere || '',
      adresseParents: editingStudent?.adresseParents || '',
      personneContact: editingStudent?.personneContact || '',
      telephoneContact: editingStudent?.telephoneContact || '',
      lienParente: editingStudent?.lienParente || '',
      etablissementOrigine: editingStudent?.etablissementOrigine || '',
      diplomeOrigine: editingStudent?.diplomeOrigine || '',
      anneeObtentionDiplome: editingStudent?.anneeObtentionDiplome || '',
      bourse: editingStudent?.bourse || '',
      chambre: editingStudent?.chambre || '',
    })

    const fields = [
      { key: 'matricule', label: 'Matricule *', required: true },
      { key: 'nom', label: 'Nom *', required: true },
      { key: 'prenom', label: 'Prénom *', required: true },
      { key: 'dateNaissance', label: 'Date de naissance' },
      { key: 'lieuNaissance', label: 'Lieu de naissance' },
      { key: 'sexe', label: 'Sexe', type: 'select', options: ['', 'Masculin', 'Féminin'] },
      { key: 'nationalite', label: 'Nationalité' },
      { key: 'telephone', label: 'Téléphone' },
      { key: 'email', label: 'Email' },
      { key: 'adresse', label: 'Adresse' },
      { key: 'nomPere', label: 'Nom du père' },
      { key: 'nomMere', label: 'Nom de la mère' },
      { key: 'telephonePere', label: 'Tél. père' },
      { key: 'telephoneMere', label: 'Tél. mère' },
      { key: 'adresseParents', label: 'Adresse parents' },
      { key: 'personneContact', label: 'Personne à contacter' },
      { key: 'telephoneContact', label: 'Tél. contact' },
      { key: 'lienParente', label: 'Lien de parenté' },
      { key: 'etablissementOrigine', label: 'Établissement d\'origine' },
      { key: 'diplomeOrigine', label: 'Diplôme d\'origine' },
      { key: 'anneeObtentionDiplome', label: 'Année d\'obtention' },
      { key: 'bourse', label: 'Bourse' },
      { key: 'chambre', label: 'Chambre' },
    ]

    return (
      <DialogOverlay onClose={() => { setShowStudentForm(false); setEditingStudent(null) }} title={editingStudent ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">{f.label}</label>
              {f.type === 'select' ? (
                <select value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
                  {f.options?.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              ) : (
                <input value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => { setShowStudentForm(false); setEditingStudent(null) }} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors">Annuler</button>
          <button onClick={() => handleSaveStudent(form)} disabled={!form.matricule || !form.nom || !form.prenom} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
            <Save className="w-3 h-3" /> {editingStudent ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </DialogOverlay>
    )
  }

  // Filiere Form Dialog
  const FiliereFormDialog = () => {
    const [form, setForm] = useState({ code: '', nom: '', description: '', niveau: '', responsable: '' })
    return (
      <DialogOverlay onClose={() => setShowFiliereForm(false)} title="Nouvelle filière">
        <div className="space-y-3">
          {[{ key: 'code', label: 'Code *' }, { key: 'nom', label: 'Nom *' }, { key: 'description', label: 'Description' }, { key: 'niveau', label: 'Niveau', type: 'select', options: ['', 'Licence', 'Master', 'Licence & Master'] }, { key: 'responsable', label: 'Responsable' }].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">{f.label}</label>
              {f.type === 'select' ? (
                <select value={form[f.key as keyof typeof form]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
                  {f.options?.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                </select>
              ) : (
                <input value={form[f.key as keyof typeof form]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setShowFiliereForm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors">Annuler</button>
          <button onClick={() => handleSaveFiliere(form)} disabled={!form.code || !form.nom} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1">
            <Save className="w-3 h-3" /> Créer
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
            <select value={form.filiereId} onChange={e => setForm({ ...form, filiereId: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              <option value="">Sélectionner</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.code} — {f.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Année scolaire *</label>
            <input value={form.anneeScolaire} onChange={e => setForm({ ...form, anneeScolaire: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Niveau *</label>
            <select value={form.niveau} onChange={e => setForm({ ...form, niveau: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              {niveauOrder.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setShowPromotionForm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors">Annuler</button>
          <button onClick={() => handleSavePromotion(form)} disabled={!form.filiereId || !form.anneeScolaire || !form.niveau} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1">
            <Save className="w-3 h-3" /> Créer
          </button>
        </div>
      </DialogOverlay>
    )
  }

  // Inscription Form Dialog
  const InscriptionFormDialog = () => {
    const [form, setForm] = useState({ studentId: '', statutDossier: 'Incomplet', redoublant: false, numeroDossier: '' })
    if (!selectedPromotion) return null
    const availableStudents = students.filter(s => !selectedPromotion.inscriptions?.some(ins => ins.studentId === s.id))

    return (
      <DialogOverlay onClose={() => setShowInscriptionForm(false)} title="Inscrire un étudiant">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Étudiant *</label>
            <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              <option value="">Sélectionner un étudiant</option>
              {availableStudents.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.nom} {s.prenom}</option>)}
            </select>
            {availableStudents.length === 0 && <p className="text-[10px] font-mono text-[#ffaa00] mt-1">Tous les étudiants sont déjà inscrits ou aucun étudiant n&apos;existe</p>}
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">N° dossier</label>
            <input value={form.numeroDossier} onChange={e => setForm({ ...form, numeroDossier: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Statut du dossier</label>
            <select value={form.statutDossier} onChange={e => setForm({ ...form, statutDossier: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              {['Complet', 'Incomplet', 'En attente', 'Validé', 'Rejeté'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.redoublant} onChange={e => setForm({ ...form, redoublant: e.target.checked })} className="rounded" />
            <label className="text-xs font-mono text-[#e0e0e6]">Redoublant</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setShowInscriptionForm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors">Annuler</button>
          <button onClick={() => handleSaveInscription({ ...form, promotionId: selectedPromotion!.id })} disabled={!form.studentId} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1">
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
              <input type={f.type || 'text'} value={form[f.key as keyof typeof form]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]" />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Semestre</label>
            <select value={form.semestre} onChange={e => setForm({ ...form, semestre: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => { setShowMatiereForm(false); setEditingMatiere(null) }} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors">Annuler</button>
          <button onClick={() => handleSaveMatiere({ ...form, coefficient: parseFloat(form.coefficient) || 1, semestre: parseInt(form.semestre) || 1, filiereId: selectedPromotion!.filiereId, promotionId: selectedPromotion!.id })} disabled={!form.code || !form.nom} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1">
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
      const file = e.target.files?.[0]
      if (!file) return
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('subfolder', 'documents')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
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
              <select value={form.etudiantId} onChange={e => setForm({ ...form, etudiantId: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
                <option value="">Sélectionner</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.nom} {s.prenom}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Titre *</label>
            <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg terminal-input text-xs font-mono text-[#e0e0e6] bg-[#12121a]">
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#6b6b8a] mb-1 block">Fichier</label>
            <div className="flex items-center gap-2">
              <label className="px-4 py-2 text-xs font-mono rounded-lg bg-[#1a1a2e] text-[#6b6b8a] border border-[rgba(255,255,255,0.06)] hover:text-[#e0e0e6] cursor-pointer transition-colors flex items-center gap-1">
                <Upload className="w-3 h-3" /> {uploading ? 'Téléchargement...' : 'Choisir'}
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
              {form.fichier && <span className="text-[10px] font-mono text-[#00ff88]">✓ Fichier attaché</span>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setShowDocumentForm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors">Annuler</button>
          <button onClick={() => handleSaveDocument(form)} disabled={!form.etudiantId || !form.titre || !form.fichier} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50 flex items-center gap-1">
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
            <p className="text-xs font-mono text-[#6b6b8a] text-center py-4">Aucune note saisie</p>
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
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteCC ?? '-'}</td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteExam ?? '-'}</td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteTP ?? '-'}</td>
                          <td className="py-1 px-2 text-center font-bold text-[#00ff88]">{n.moyenne?.toFixed(2) ?? '-'}</td>
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
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteCC ?? '-'}</td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteExam ?? '-'}</td>
                          <td className="py-1 px-2 text-center text-[#e0e0e6]">{n.noteTP ?? '-'}</td>
                          <td className="py-1 px-2 text-center font-bold text-[#00ff88]">{n.moyenne?.toFixed(2) ?? '-'}</td>
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

  // Generic Dialog Overlay
  const DialogOverlay = ({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg p-6 rounded-xl bg-[#12121a] border border-[rgba(255,255,255,0.06)] shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono font-bold text-[#00ff88]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  )

  // ========================
  // RENDER
  // ========================
  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">
      {mobileMenuOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={view + (selectedStudent?.id || '') + (selectedPromotion?.id || '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {view === 'dashboard' && <DashboardView />}
              {view === 'students' && <StudentsView />}
              {view === 'promotions' && <PromotionsView />}
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
        {showClotureConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowClotureConfirm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md p-6 rounded-xl bg-[#12121a] border border-[#ff4444]/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[#ff4444]/10"><AlertTriangle className="w-5 h-5 text-[#ff4444]" /></div>
                <h3 className="text-sm font-mono font-bold text-[#ff4444]">Clôturer la promotion</h3>
              </div>
              <p className="text-xs font-mono text-[#e0e0e6] mb-2">Cette action est irréversible. Après clôture :</p>
              <ul className="text-xs font-mono text-[#6b6b8a] list-disc list-inside mb-4 space-y-1">
                <li>Aucune modification de notes</li>
                <li>Aucune modification d&apos;inscriptions</li>
                <li>Aucune modification de matières</li>
                <li>Toutes les données seront verrouillées</li>
              </ul>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowClotureConfirm(false)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors">Annuler</button>
                <button onClick={handleCloturer} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center gap-1">
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
                <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-xs font-mono rounded-lg text-[#6b6b8a] hover:text-[#e0e0e6] transition-colors">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 text-xs font-mono rounded-lg bg-[#ff4444]/10 text-[#ff4444] border border-[#ff4444]/20 hover:bg-[#ff4444]/20 transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
