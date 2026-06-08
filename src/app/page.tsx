'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, GraduationCap, FileText, Plus, Search, Edit, Trash2,
  Eye, Upload, X, ChevronLeft, ChevronRight, Menu, UserCircle, Phone, Mail,
  MapPin, Calendar, Award, Building, BookOpen, Shield, Home, Filter,
  ArrowLeft, Download, File, Image, CheckCircle2, AlertCircle, Loader2,
  Hash, User, Briefcase, FolderOpen, TrendingUp, UserCheck, FileBadge,
  Settings2
} from 'lucide-react'
import { toast } from 'sonner'

// ==================== TYPES ====================
interface Student {
  id: string
  matricule: string
  nom: string
  prenom: string
  dateNaissance: string | null
  lieuNaissance: string | null
  sexe: string | null
  nationalite: string | null
  photo: string | null
  telephone: string | null
  email: string | null
  adresse: string | null
  nomPere: string | null
  nomMere: string | null
  telephonePere: string | null
  telephoneMere: string | null
  adresseParents: string | null
  personneContact: string | null
  telephoneContact: string | null
  lienParente: string | null
  filiere: string | null
  niveau: string | null
  anneeInscription: string | null
  statut: string | null
  numeroDossier: string | null
  etablissementOrigine: string | null
  diplomeOrigine: string | null
  anneeObtentionDiplome: string | null
  bourse: string | null
  chambre: string | null
  createdAt: string
  updatedAt: string
  documents?: Document[]
}

interface Document {
  id: string
  titre: string
  type: string
  fichier: string
  tailleFichier: string | null
  etudiantId: string
  createdAt: string
  updatedAt: string
  student?: { id: string; nom: string; prenom: string; matricule: string }
}

interface Filiere {
  id: string
  code: string
  nom: string
  description: string | null
  niveau: string | null
  responsable: string | null
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalStudents: number
  totalFilieres: number
  totalDocuments: number
  activeStudents: number
  byFiliere: { name: string | null; count: number }[]
  byNiveau: { name: string | null; count: number }[]
  byStatut: { name: string | null; count: number }[]
  bySexe: { name: string | null; count: number }[]
  recentStudents: Student[]
}

type View = 'dashboard' | 'students' | 'filieres' | 'documents'

const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2']
const STATUTS = ['Actif', 'Inactif', 'Diplômé', 'Renvoyé']
const SEXES = ['Masculin', 'Féminin']
const DOC_TYPES = ['Acte de naissance', 'Relevé de notes', 'Diplôme', 'Certificat', 'Photo', 'Autre']
const ANNEES = ['2020-2021', '2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026']

// ==================== API HELPERS ====================
async function apiGet(path: string) {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Erreur API: ${res.status}`)
  return res.json()
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur' }))
    throw new Error(err.error || 'Erreur')
  }
  return res.json()
}

async function apiPut(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur' }))
    throw new Error(err.error || 'Erreur')
  }
  return res.json()
}

async function apiDelete(path: string) {
  const res = await fetch(path, { method: 'DELETE' })
  if (!res.ok) throw new Error('Erreur de suppression')
  return res.json()
}

async function uploadFile(file: File, type: string = 'document') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Erreur de téléchargement')
  return res.json()
}

// ==================== EMPTY STUDENT ====================
const emptyStudent: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'documents'> = {
  matricule: '', nom: '', prenom: '', dateNaissance: '', lieuNaissance: '',
  sexe: '', nationalite: 'Gabonaise', photo: '', telephone: '', email: '',
  adresse: '', nomPere: '', nomMere: '', telephonePere: '', telephoneMere: '',
  adresseParents: '', personneContact: '', telephoneContact: '', lienParente: '',
  filiere: '', niveau: '', anneeInscription: '', statut: 'Actif', numeroDossier: '',
  etablissementOrigine: '', diplomeOrigine: '', anneeObtentionDiplome: '',
  bourse: '', chambre: '',
}

// ==================== ANIMATED COUNTER ====================
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const end = value
    const startTime = Date.now()
    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    prev.current = value
  }, [value, duration])

  return <>{display}</>
}

// ==================== STAT CARD ====================
function StatCard({ title, value, icon: Icon, color, delay = 0 }: {
  title: string; value: number; icon: React.ElementType; color: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`neon-border rounded-lg p-5 bg-[#12121a] relative overflow-hidden group cursor-default`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-full h-full" style={{ color }} />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-md" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span className="text-sm text-[#6b6b8a] font-mono uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-3xl font-bold font-mono" style={{ color }}>
        <AnimatedCounter value={value} />
      </div>
    </motion.div>
  )
}

// ==================== STUDENT FORM ====================
function StudentForm({ student, filieres, onSave, onCancel }: {
  student: Partial<Student>
  filieres: Filiere[]
  onSave: (data: Partial<Student>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(student)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadFile(file, 'photo')
      setForm(prev => ({ ...prev, photo: result.path }))
      toast.success('Photo téléchargée')
    } catch {
      toast.error('Erreur lors du téléchargement de la photo')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.matricule || !form.nom || !form.prenom) {
      toast.error('Matricule, nom et prénom sont requis')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const sectionClass = "mb-6"
  const sectionTitleClass = "text-xs font-mono uppercase tracking-widest text-[#00ff88] mb-3 flex items-center gap-2"
  const fieldClass = "space-y-1.5"
  const inputClass = "terminal-input w-full rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6] placeholder:text-[#4a4a6a]"
  const labelClass = "text-xs font-mono text-[#6b6b8a] uppercase tracking-wider"
  const selectClass = "terminal-input w-full rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6] appearance-none"

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Identité */}
      <div className={sectionClass}>
        <div className={sectionTitleClass}><User className="w-3.5 h-3.5" /> Identité</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldClass}>
            <label className={labelClass}>Matricule *</label>
            <input className={inputClass} value={form.matricule || ''} onChange={e => updateField('matricule', e.target.value)} placeholder="EX: 2024-001" required />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Nom *</label>
            <input className={inputClass} value={form.nom || ''} onChange={e => updateField('nom', e.target.value)} placeholder="Nom de famille" required />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Prénom *</label>
            <input className={inputClass} value={form.prenom || ''} onChange={e => updateField('prenom', e.target.value)} placeholder="Prénom(s)" required />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Date de naissance</label>
            <input type="date" className={inputClass} value={form.dateNaissance || ''} onChange={e => updateField('dateNaissance', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Lieu de naissance</label>
            <input className={inputClass} value={form.lieuNaissance || ''} onChange={e => updateField('lieuNaissance', e.target.value)} placeholder="Ville, Pays" />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Sexe</label>
            <select className={selectClass} value={form.sexe || ''} onChange={e => updateField('sexe', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {SEXES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Nationalité</label>
            <input className={inputClass} value={form.nationalite || ''} onChange={e => updateField('nationalite', e.target.value)} placeholder="Gabonaise" />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Photo</label>
            <div className="flex gap-2 items-center">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="px-3 py-2 text-xs rounded-md border border-[rgba(0,255,136,0.3)] text-[#00ff88] hover:bg-[rgba(0,255,136,0.1)] transition-all disabled:opacity-50">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              </button>
              {form.photo && <span className="text-xs text-[#6b6b8a] truncate">✓ Photo</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className={sectionClass}>
        <div className={sectionTitleClass}><Phone className="w-3.5 h-3.5" /> Contact</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldClass}>
            <label className={labelClass}>Téléphone</label>
            <input className={inputClass} value={form.telephone || ''} onChange={e => updateField('telephone', e.target.value)} placeholder="+241 XX XX XX XX" />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="email@example.com" />
          </div>
          <div className={`${fieldClass} col-span-2`}>
            <label className={labelClass}>Adresse</label>
            <input className={inputClass} value={form.adresse || ''} onChange={e => updateField('adresse', e.target.value)} placeholder="Adresse complète" />
          </div>
        </div>
      </div>

      {/* Parents/Tuteur */}
      <div className={sectionClass}>
        <div className={sectionTitleClass}><Users className="w-3.5 h-3.5" /> Parents / Tuteur</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldClass}>
            <label className={labelClass}>Nom du père</label>
            <input className={inputClass} value={form.nomPere || ''} onChange={e => updateField('nomPere', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Tél. père</label>
            <input className={inputClass} value={form.telephonePere || ''} onChange={e => updateField('telephonePere', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Nom de la mère</label>
            <input className={inputClass} value={form.nomMere || ''} onChange={e => updateField('nomMere', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Tél. mère</label>
            <input className={inputClass} value={form.telephoneMere || ''} onChange={e => updateField('telephoneMere', e.target.value)} />
          </div>
          <div className={`${fieldClass} col-span-2`}>
            <label className={labelClass}>Adresse parents</label>
            <input className={inputClass} value={form.adresseParents || ''} onChange={e => updateField('adresseParents', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Personne à contacter</label>
            <input className={inputClass} value={form.personneContact || ''} onChange={e => updateField('personneContact', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Tél. contact</label>
            <input className={inputClass} value={form.telephoneContact || ''} onChange={e => updateField('telephoneContact', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Lien de parenté</label>
            <input className={inputClass} value={form.lienParente || ''} onChange={e => updateField('lienParente', e.target.value)} placeholder="Père, Mère, Oncle..." />
          </div>
        </div>
      </div>

      {/* Académique */}
      <div className={sectionClass}>
        <div className={sectionTitleClass}><GraduationCap className="w-3.5 h-3.5" /> Académique</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldClass}>
            <label className={labelClass}>Filière</label>
            <select className={selectClass} value={form.filiere || ''} onChange={e => updateField('filiere', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {filieres.map(f => <option key={f.id} value={f.nom}>{f.code} - {f.nom}</option>)}
            </select>
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Niveau</label>
            <select className={selectClass} value={form.niveau || ''} onChange={e => updateField('niveau', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Année d&apos;inscription</label>
            <select className={selectClass} value={form.anneeInscription || ''} onChange={e => updateField('anneeInscription', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Statut</label>
            <select className={selectClass} value={form.statut || ''} onChange={e => updateField('statut', e.target.value)}>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className={`${fieldClass} col-span-2`}>
            <label className={labelClass}>N° dossier</label>
            <input className={inputClass} value={form.numeroDossier || ''} onChange={e => updateField('numeroDossier', e.target.value)} placeholder="Numéro de dossier" />
          </div>
        </div>
      </div>

      {/* Origine */}
      <div className={sectionClass}>
        <div className={sectionTitleClass}><Building className="w-3.5 h-3.5" /> Origine</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`${fieldClass} col-span-2`}>
            <label className={labelClass}>Établissement d&apos;origine</label>
            <input className={inputClass} value={form.etablissementOrigine || ''} onChange={e => updateField('etablissementOrigine', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Diplôme d&apos;origine</label>
            <input className={inputClass} value={form.diplomeOrigine || ''} onChange={e => updateField('diplomeOrigine', e.target.value)} />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Année d&apos;obtention</label>
            <input className={inputClass} value={form.anneeObtentionDiplome || ''} onChange={e => updateField('anneeObtentionDiplome', e.target.value)} placeholder="2023" />
          </div>
        </div>
      </div>

      {/* Administratif */}
      <div className={sectionClass}>
        <div className={sectionTitleClass}><Shield className="w-3.5 h-3.5" /> Administratif</div>
        <div className="grid grid-cols-2 gap-3">
          <div className={fieldClass}>
            <label className={labelClass}>Bourse</label>
            <input className={inputClass} value={form.bourse || ''} onChange={e => updateField('bourse', e.target.value)} placeholder="Type de bourse" />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Chambre</label>
            <input className={inputClass} value={form.chambre || ''} onChange={e => updateField('chambre', e.target.value)} placeholder="N° chambre campus" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border border-[rgba(255,255,255,0.1)] text-[#6b6b8a] hover:text-[#e0e0e6] hover:border-[rgba(255,255,255,0.2)] transition-all">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-md bg-[#00ff88] text-[#0a0a0f] font-bold hover:bg-[#00ff88]/90 transition-all disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {student.id ? 'Mettre à jour' : 'Créer l\'étudiant'}
        </button>
      </div>
    </form>
  )
}

// ==================== FILIERE FORM ====================
function FiliereForm({ filiere, onSave, onCancel }: {
  filiere: Partial<Filiere>
  onSave: (data: Partial<Filiere>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(filiere)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code || !form.nom) {
      toast.error('Code et nom sont requis')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "terminal-input w-full rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6] placeholder:text-[#4a4a6a]"
  const labelClass = "text-xs font-mono text-[#6b6b8a] uppercase tracking-wider"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelClass}>Code *</label>
        <input className={inputClass} value={form.code || ''} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="EX: INFO" required />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Nom *</label>
        <input className={inputClass} value={form.nom || ''} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Informatique" required />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Description</label>
        <textarea className={`${inputClass} min-h-[60px]`} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description de la filière" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass}>Niveau</label>
          <select className="terminal-input w-full rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6] appearance-none"
            value={form.niveau || ''} onChange={e => setForm(p => ({ ...p, niveau: e.target.value }))}>
            <option value="">—</option>
            <option value="Licence">Licence (L1-L3)</option>
            <option value="Master">Master (M1-M2)</option>
            <option value="Licence & Master">Licence & Master</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Responsable</label>
          <input className={inputClass} value={form.responsable || ''} onChange={e => setForm(p => ({ ...p, responsable: e.target.value }))} placeholder="Nom du responsable" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md border border-[rgba(255,255,255,0.1)] text-[#6b6b8a] hover:text-[#e0e0e6] transition-all">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-md bg-[#00ff88] text-[#0a0a0f] font-bold hover:bg-[#00ff88]/90 transition-all disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {filiere.id ? 'Mettre à jour' : 'Créer la filière'}
        </button>
      </div>
    </form>
  )
}

// ==================== MAIN APP ====================
export default function CUKApp() {
  // Navigation
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebar, setMobileSidebar] = useState(false)

  // Data
  const [students, setStudents] = useState<Student[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  // Loading
  const [loading, setLoading] = useState(true)

  // Student sub-view
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Partial<Student>>(emptyStudent)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Filiere sub-view
  const [showFiliereForm, setShowFiliereForm] = useState(false)
  const [editingFiliere, setEditingFiliere] = useState<Partial<Filiere>>({})
  const [deleteFiliereConfirm, setDeleteFiliereConfirm] = useState<string | null>(null)

  // Document sub-view
  const [showDocUpload, setShowDocUpload] = useState(false)
  const [docUploadForm, setDocUploadForm] = useState({ titre: '', type: '', etudiantId: '' })
  const [docFile, setDocFile] = useState<File | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docFilterStudent, setDocFilterStudent] = useState('')
  const [docFilterType, setDocFilterType] = useState('')

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('')
  const [filterNiveau, setFilterNiveau] = useState('')
  const [filterStatut, setFilterStatut] = useState('')

  // Debounced search
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const debouncedSearch = useCallback((term: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearchTerm(term), 300)
  }, [])

  // ==================== DATA FETCHING ====================
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiGet('/api/stats')
      setStats(data)
    } catch { /* ignore */ }
  }, [])

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      if (filterFiliere) params.set('filiere', filterFiliere)
      if (filterNiveau) params.set('niveau', filterNiveau)
      if (filterStatut) params.set('statut', filterStatut)
      const data = await apiGet(`/api/students?${params.toString()}`)
      setStudents(data)
    } catch {
      toast.error('Erreur de chargement des étudiants')
    }
  }, [searchTerm, filterFiliere, filterNiveau, filterStatut])

  const fetchFilieres = useCallback(async () => {
    try {
      const data = await apiGet('/api/filieres')
      setFilieres(data)
    } catch {
      toast.error('Erreur de chargement des filières')
    }
  }, [])

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (docFilterStudent) params.set('etudiantId', docFilterStudent)
      if (docFilterType) params.set('type', docFilterType)
      const data = await apiGet(`/api/documents?${params.toString()}`)
      setDocuments(data)
    } catch {
      toast.error('Erreur de chargement des documents')
    }
  }, [docFilterStudent, docFilterType])

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchStudents(), fetchFilieres(), fetchDocuments()])
      setLoading(false)
    }
    init()
  }, [])

  // Refetch on filter changes
  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  // ==================== HANDLERS ====================
  const handleSaveStudent = async (data: Partial<Student>) => {
    try {
      if (data.id) {
        const updated = await apiPut(`/api/students/${data.id}`, data)
        toast.success('Étudiant mis à jour')
        setSelectedStudent(updated)
      } else {
        const created = await apiPost('/api/students', data)
        toast.success('Étudiant créé avec succès')
        setSelectedStudent(created)
      }
      setShowStudentForm(false)
      setEditingStudent(emptyStudent)
      fetchStudents()
      fetchStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDeleteStudent = async (id: string) => {
    try {
      await apiDelete(`/api/students/${id}`)
      toast.success('Étudiant supprimé')
      setDeleteConfirm(null)
      setSelectedStudent(null)
      fetchStudents()
      fetchStats()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleSaveFiliere = async (data: Partial<Filiere>) => {
    try {
      if (data.id) {
        await apiPut(`/api/filieres/${data.id}`, data)
        toast.success('Filière mise à jour')
      } else {
        await apiPost('/api/filieres', data)
        toast.success('Filière créée avec succès')
      }
      setShowFiliereForm(false)
      setEditingFiliere({})
      fetchFilieres()
      fetchStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDeleteFiliere = async (id: string) => {
    try {
      await apiDelete(`/api/filieres/${id}`)
      toast.success('Filière supprimée')
      setDeleteFiliereConfirm(null)
      fetchFilieres()
      fetchStats()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docUploadForm.titre || !docUploadForm.type || !docUploadForm.etudiantId || !docFile) {
      toast.error('Tous les champs sont requis')
      return
    }
    setUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('titre', docUploadForm.titre)
      formData.append('type', docUploadForm.type)
      formData.append('etudiantId', docUploadForm.etudiantId)
      formData.append('fichier', docFile)
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Document ajouté')
      setShowDocUpload(false)
      setDocUploadForm({ titre: '', type: '', etudiantId: '' })
      setDocFile(null)
      fetchDocuments()
      fetchStats()
      if (selectedStudent?.id === docUploadForm.etudiantId) {
        const updated = await apiGet(`/api/students/${selectedStudent.id}`)
        setSelectedStudent(updated)
      }
    } catch {
      toast.error('Erreur lors de l\'ajout du document')
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      await apiDelete(`/api/documents/${id}`)
      toast.success('Document supprimé')
      fetchDocuments()
      fetchStats()
      if (selectedStudent) {
        const updated = await apiGet(`/api/students/${selectedStudent.id}`)
        setSelectedStudent(updated)
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  // ==================== SIDEBAR ITEMS ====================
  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as View, label: 'Étudiants', icon: Users },
    { id: 'filieres' as View, label: 'Filières', icon: GraduationCap },
    { id: 'documents' as View, label: 'Documents', icon: FileText },
  ]

  // ==================== RENDER HELPERS ====================
  const getStatusColor = (statut: string | null) => {
    switch (statut) {
      case 'Actif': return '#00ff88'
      case 'Inactif': return '#ff6b6b'
      case 'Diplômé': return '#00d4ff'
      case 'Renvoyé': return '#ff4444'
      default: return '#6b6b8a'
    }
  }

  // ==================== SIDEBAR ====================
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0">
            <img src="/cuk-logo.png" alt="CUK" className="w-full h-full object-cover" />
          </div>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <div className="text-[#00ff88] font-bold text-lg font-mono neon-text">CUK</div>
              <div className="text-[10px] text-[#6b6b8a] font-mono whitespace-nowrap">Koulamoutou</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveView(item.id); setMobileSidebar(false); setSelectedStudent(null) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-mono transition-all duration-200 group ${
              activeView === item.id
                ? 'bg-[rgba(0,255,136,0.08)] text-[#00ff88] border-l-2 border-[#00ff88]'
                : 'text-[#6b6b8a] hover:text-[#e0e0e6] hover:bg-[rgba(255,255,255,0.03)]'
            }`}
          >
            <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${activeView === item.id ? 'text-[#00ff88]' : 'text-[#6b6b8a] group-hover:text-[#e0e0e6]'}`} />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
          <div className="text-[10px] text-[#4a4a6a] font-mono">
            <div className="text-[#6b6b8a] mb-1">v1.0.0</div>
            <div>Centre Universitaire</div>
            <div className="text-[#00ff88]">de Koulamoutou</div>
          </div>
        </div>
      )}
    </div>
  )

  // ==================== DASHBOARD VIEW ====================
  const DashboardView = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono text-[#e0e0e6]">
            <span className="text-[#00ff88] neon-text">$</span> Dashboard
          </h1>
          <p className="text-sm text-[#6b6b8a] font-mono mt-1">Bienvenue — Centre Universitaire de Koulamoutou</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditingStudent(emptyStudent); setShowStudentForm(true) }}
            className="px-3 py-2 text-xs rounded-md bg-[#00ff88] text-[#0a0a0f] font-bold hover:bg-[#00ff88]/90 transition-all flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouvel Étudiant
          </button>
          <button onClick={() => { setEditingFiliere({}); setShowFiliereForm(true) }}
            className="px-3 py-2 text-xs rounded-md border border-[rgba(0,212,255,0.3)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition-all flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouvelle Filière
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Étudiants" value={stats?.totalStudents || 0} icon={Users} color="#00ff88" delay={0} />
        <StatCard title="Filières" value={stats?.totalFilieres || 0} icon={GraduationCap} color="#00d4ff" delay={0.1} />
        <StatCard title="Documents" value={stats?.totalDocuments || 0} icon={FileText} color="#ffd93d" delay={0.2} />
        <StatCard title="Actifs" value={stats?.activeStudents || 0} icon={UserCheck} color="#c084fc" delay={0.3} />
      </div>

      {/* Stats Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By Filiere */}
        <div className="neon-border rounded-lg p-4 bg-[#12121a]">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#00d4ff] mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Par Filière
          </h3>
          {stats?.byFiliere.length ? (
            <div className="space-y-2">
              {stats.byFiliere.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm font-mono">
                  <span className="text-[#e0e0e6] truncate">{item.name || 'Non défini'}</span>
                  <span className="text-[#00d4ff] font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#4a4a6a] font-mono">Aucune donnée</div>
          )}
        </div>

        {/* By Niveau */}
        <div className="neon-border rounded-lg p-4 bg-[#12121a]">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#ffd93d] mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Par Niveau
          </h3>
          {stats?.byNiveau.length ? (
            <div className="space-y-2">
              {stats.byNiveau.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm font-mono">
                  <span className="text-[#e0e0e6]">{item.name || 'Non défini'}</span>
                  <span className="text-[#ffd93d] font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#4a4a6a] font-mono">Aucune donnée</div>
          )}
        </div>

        {/* By Statut */}
        <div className="neon-border rounded-lg p-4 bg-[#12121a]">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#c084fc] mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Par Statut
          </h3>
          {stats?.byStatut.length ? (
            <div className="space-y-2">
              {stats.byStatut.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm font-mono">
                  <span className="text-[#e0e0e6]">{item.name || 'Non défini'}</span>
                  <span className="font-bold" style={{ color: getStatusColor(item.name) }}>{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#4a4a6a] font-mono">Aucune donnée</div>
          )}
        </div>
      </div>

      {/* Recent Students */}
      <div className="neon-border rounded-lg p-4 bg-[#12121a]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#00ff88] flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Étudiants Récents
          </h3>
          <button onClick={() => setActiveView('students')} className="text-xs text-[#6b6b8a] hover:text-[#00ff88] transition-colors font-mono">
            Voir tout →
          </button>
        </div>
        {stats?.recentStudents.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left py-2 px-3 text-[#6b6b8a] text-xs uppercase">Matricule</th>
                  <th className="text-left py-2 px-3 text-[#6b6b8a] text-xs uppercase">Nom</th>
                  <th className="text-left py-2 px-3 text-[#6b6b8a] text-xs uppercase">Filière</th>
                  <th className="text-left py-2 px-3 text-[#6b6b8a] text-xs uppercase">Niveau</th>
                  <th className="text-left py-2 px-3 text-[#6b6b8a] text-xs uppercase">Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentStudents.map(s => (
                  <tr key={s.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(0,255,136,0.03)] transition-colors cursor-pointer"
                    onClick={() => { setActiveView('students'); setSelectedStudent(s) }}>
                    <td className="py-2.5 px-3 text-[#00d4ff]">{s.matricule}</td>
                    <td className="py-2.5 px-3 text-[#e0e0e6]">{s.nom} {s.prenom}</td>
                    <td className="py-2.5 px-3 text-[#6b6b8a]">{s.filiere || '—'}</td>
                    <td className="py-2.5 px-3 text-[#6b6b8a]">{s.niveau || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(s.statut) }} />
                        <span style={{ color: getStatusColor(s.statut) }}>{s.statut || '—'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-[#2a2a4a] mx-auto mb-3" />
            <p className="text-sm text-[#4a4a6a] font-mono">Aucun étudiant enregistré</p>
            <button onClick={() => { setEditingStudent(emptyStudent); setShowStudentForm(true) }}
              className="mt-3 text-xs text-[#00ff88] hover:underline font-mono">
              + Ajouter le premier étudiant
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ==================== STUDENT DETAIL VIEW ====================
  const StudentDetailView = () => {
    if (!selectedStudent) return null
    const s = selectedStudent

    const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => (
      <div className="flex items-start gap-2.5 py-1.5">
        <Icon className="w-3.5 h-3.5 text-[#6b6b8a] mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[10px] text-[#4a4a6a] font-mono uppercase tracking-wider">{label}</div>
          <div className="text-sm text-[#e0e0e6] font-mono">{value || '—'}</div>
        </div>
      </div>
    )

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="animate-fade-in">
        <button onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-1.5 text-xs text-[#6b6b8a] hover:text-[#00ff88] transition-colors font-mono mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la liste
        </button>

        {/* Header */}
        <div className="neon-border rounded-lg p-6 bg-[#12121a] mb-4">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-[rgba(0,255,136,0.2)] bg-[#0a0a0f] flex-shrink-0">
              {s.photo ? (
                <img src={s.photo} alt={`${s.prenom} ${s.nom}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCircle className="w-10 h-10 text-[#2a2a4a]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold font-mono text-[#e0e0e6]">{s.nom} {s.prenom}</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full border"
                  style={{ color: getStatusColor(s.statut), borderColor: getStatusColor(s.statut) + '40', background: getStatusColor(s.statut) + '10' }}>
                  {s.statut || '—'}
                </span>
              </div>
              <div className="text-sm text-[#00d4ff] font-mono mb-2">{s.matricule}</div>
              <div className="flex gap-4 text-xs text-[#6b6b8a] font-mono">
                {s.filiere && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{s.filiere}</span>}
                {s.niveau && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{s.niveau}</span>}
                {s.anneeInscription && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{s.anneeInscription}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingStudent(s); setShowStudentForm(true) }}
                className="p-2 rounded-md border border-[rgba(0,255,136,0.3)] text-[#00ff88] hover:bg-[rgba(0,255,136,0.1)] transition-all">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteConfirm(s.id)}
                className="p-2 rounded-md border border-[rgba(255,68,68,0.3)] text-[#ff4444] hover:bg-[rgba(255,68,68,0.1)] transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Identité */}
          <div className="neon-border rounded-lg p-4 bg-[#12121a]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#00ff88] mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Identité
            </h3>
            <InfoRow icon={Hash} label="Matricule" value={s.matricule} />
            <InfoRow icon={Calendar} label="Date de naissance" value={s.dateNaissance} />
            <InfoRow icon={MapPin} label="Lieu de naissance" value={s.lieuNaissance} />
            <InfoRow icon={User} label="Sexe" value={s.sexe} />
            <InfoRow icon={MapPin} label="Nationalité" value={s.nationalite} />
          </div>

          {/* Contact */}
          <div className="neon-border rounded-lg p-4 bg-[#12121a]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#00d4ff] mb-3 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Contact
            </h3>
            <InfoRow icon={Phone} label="Téléphone" value={s.telephone} />
            <InfoRow icon={Mail} label="Email" value={s.email} />
            <InfoRow icon={MapPin} label="Adresse" value={s.adresse} />
          </div>

          {/* Parents */}
          <div className="neon-border rounded-lg p-4 bg-[#12121a]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#ffd93d] mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Parents / Tuteur
            </h3>
            <InfoRow icon={User} label="Nom du père" value={s.nomPere} />
            <InfoRow icon={Phone} label="Tél. père" value={s.telephonePere} />
            <InfoRow icon={User} label="Nom de la mère" value={s.nomMere} />
            <InfoRow icon={Phone} label="Tél. mère" value={s.telephoneMere} />
            <InfoRow icon={MapPin} label="Adresse parents" value={s.adresseParents} />
            <InfoRow icon={User} label="Personne contact" value={s.personneContact} />
            <InfoRow icon={Phone} label="Tél. contact" value={s.telephoneContact} />
            <InfoRow icon={User} label="Lien parenté" value={s.lienParente} />
          </div>

          {/* Académique */}
          <div className="neon-border rounded-lg p-4 bg-[#12121a]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#c084fc] mb-3 flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" /> Académique
            </h3>
            <InfoRow icon={BookOpen} label="Filière" value={s.filiere} />
            <InfoRow icon={TrendingUp} label="Niveau" value={s.niveau} />
            <InfoRow icon={Calendar} label="Année inscription" value={s.anneeInscription} />
            <InfoRow icon={Shield} label="Statut" value={s.statut} />
            <InfoRow icon={Hash} label="N° dossier" value={s.numeroDossier} />
          </div>

          {/* Origine */}
          <div className="neon-border rounded-lg p-4 bg-[#12121a]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#ff6b6b] mb-3 flex items-center gap-2">
              <Building className="w-3.5 h-3.5" /> Origine
            </h3>
            <InfoRow icon={Building} label="Établissement" value={s.etablissementOrigine} />
            <InfoRow icon={Award} label="Diplôme" value={s.diplomeOrigine} />
            <InfoRow icon={Calendar} label="Année obtention" value={s.anneeObtentionDiplome} />
          </div>

          {/* Administratif */}
          <div className="neon-border rounded-lg p-4 bg-[#12121a]">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#00ff88] mb-3 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" /> Administratif
            </h3>
            <InfoRow icon={Award} label="Bourse" value={s.bourse} />
            <InfoRow icon={Home} label="Chambre" value={s.chambre} />
          </div>
        </div>

        {/* Documents */}
        <div className="neon-border rounded-lg p-4 bg-[#12121a]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#00d4ff] flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Documents ({s.documents?.length || 0})
            </h3>
            <button onClick={() => { setShowDocUpload(true); setDocUploadForm(prev => ({ ...prev, etudiantId: s.id })) }}
              className="text-xs text-[#00ff88] hover:underline font-mono flex items-center gap-1">
              <Plus className="w-3 h-3" /> Ajouter
            </button>
          </div>
          {s.documents?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {s.documents.map(doc => (
                <div key={doc.id} className="p-3 rounded-md border border-[rgba(255,255,255,0.06)] bg-[#0a0a0f] hover:border-[rgba(0,212,255,0.3)] transition-all group">
                  <div className="flex items-start gap-2">
                    <File className="w-4 h-4 text-[#00d4ff] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#e0e0e6] font-mono truncate">{doc.titre}</div>
                      <div className="text-[10px] text-[#4a4a6a] font-mono mt-0.5">{doc.type} • {doc.tailleFichier || '—'}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={doc.fichier} target="_blank" rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-[rgba(0,212,255,0.1)] text-[#00d4ff]">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 rounded hover:bg-[rgba(255,68,68,0.1)] text-[#ff4444]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FolderOpen className="w-8 h-8 text-[#2a2a4a] mx-auto mb-2" />
              <p className="text-xs text-[#4a4a6a] font-mono">Aucun document</p>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // ==================== STUDENTS VIEW ====================
  const StudentsView = () => {
    if (selectedStudent) return <StudentDetailView />

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-mono text-[#e0e0e6]">
            <span className="text-[#00ff88] neon-text">$</span> Étudiants
          </h1>
          <button onClick={() => { setEditingStudent(emptyStudent); setShowStudentForm(true) }}
            className="px-3 py-2 text-xs rounded-md bg-[#00ff88] text-[#0a0a0f] font-bold hover:bg-[#00ff88]/90 transition-all flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouvel Étudiant
          </button>
        </div>

        {/* Search & Filters */}
        <div className="neon-border rounded-lg p-3 bg-[#12121a]">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#6b6b8a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="terminal-input w-full rounded-md pl-9 pr-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6] placeholder:text-[#4a4a6a]"
                placeholder="Rechercher (matricule, nom, prénom...)"
                onChange={e => debouncedSearch(e.target.value)}
              />
            </div>
            <select className="terminal-input rounded-md px-3 py-2 text-xs bg-[#0a0a0f] text-[#e0e0e6] appearance-none"
              value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)}>
              <option value="">Toutes filières</option>
              {filieres.map(f => <option key={f.id} value={f.nom}>{f.nom}</option>)}
            </select>
            <select className="terminal-input rounded-md px-3 py-2 text-xs bg-[#0a0a0f] text-[#e0e0e6] appearance-none"
              value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}>
              <option value="">Tous niveaux</option>
              {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className="terminal-input rounded-md px-3 py-2 text-xs bg-[#0a0a0f] text-[#e0e0e6] appearance-none"
              value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
              <option value="">Tous statuts</option>
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(filterFiliere || filterNiveau || filterStatut || searchTerm) && (
              <button onClick={() => { setFilterFiliere(''); setFilterNiveau(''); setFilterStatut(''); setSearchTerm('') }}
                className="text-xs text-[#ff6b6b] hover:underline font-mono flex items-center gap-1">
                <X className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="neon-border rounded-lg bg-[#12121a] overflow-hidden">
          {students.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left py-3 px-4 text-[#6b6b8a] text-xs uppercase">Photo</th>
                    <th className="text-left py-3 px-4 text-[#6b6b8a] text-xs uppercase">Matricule</th>
                    <th className="text-left py-3 px-4 text-[#6b6b8a] text-xs uppercase">Nom Complet</th>
                    <th className="text-left py-3 px-4 text-[#6b6b8a] text-xs uppercase">Filière</th>
                    <th className="text-left py-3 px-4 text-[#6b6b8a] text-xs uppercase">Niveau</th>
                    <th className="text-left py-3 px-4 text-[#6b6b8a] text-xs uppercase">Statut</th>
                    <th className="text-left py-3 px-4 text-[#6b6b8a] text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id}
                      className={`border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(0,255,136,0.03)] transition-colors cursor-pointer ${i % 2 === 1 ? 'bg-[rgba(255,255,255,0.01)]' : ''}`}
                      onClick={() => setSelectedStudent(s)}>
                      <td className="py-2.5 px-4">
                        <div className="w-8 h-8 rounded-md overflow-hidden bg-[#0a0a0f] border border-[rgba(255,255,255,0.06)]">
                          {s.photo ? (
                            <img src={s.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UserCircle className="w-5 h-5 text-[#2a2a4a]" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-[#00d4ff]">{s.matricule}</td>
                      <td className="py-2.5 px-4 text-[#e0e0e6]">{s.nom} {s.prenom}</td>
                      <td className="py-2.5 px-4 text-[#6b6b8a]">{s.filiere || '—'}</td>
                      <td className="py-2.5 px-4 text-[#6b6b8a]">{s.niveau || '—'}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: getStatusColor(s.statut) }} />
                          <span style={{ color: getStatusColor(s.statut) }}>{s.statut || '—'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setSelectedStudent(s)}
                            className="p-1.5 rounded hover:bg-[rgba(0,212,255,0.1)] text-[#6b6b8a] hover:text-[#00d4ff] transition-all">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setEditingStudent(s); setShowStudentForm(true) }}
                            className="p-1.5 rounded hover:bg-[rgba(0,255,136,0.1)] text-[#6b6b8a] hover:text-[#00ff88] transition-all">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(s.id)}
                            className="p-1.5 rounded hover:bg-[rgba(255,68,68,0.1)] text-[#6b6b8a] hover:text-[#ff4444] transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="w-14 h-14 text-[#2a2a4a] mx-auto mb-4" />
              <p className="text-lg text-[#4a4a6a] font-mono mb-2">Aucun étudiant trouvé</p>
              <p className="text-sm text-[#3a3a5a] font-mono mb-4">
                {searchTerm || filterFiliere || filterNiveau || filterStatut
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par ajouter votre premier étudiant'}
              </p>
              {!searchTerm && !filterFiliere && !filterNiveau && !filterStatut && (
                <button onClick={() => { setEditingStudent(emptyStudent); setShowStudentForm(true) }}
                  className="px-4 py-2 text-sm rounded-md bg-[#00ff88] text-[#0a0a0f] font-bold hover:bg-[#00ff88]/90 transition-all inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Ajouter un étudiant
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ==================== FILIERES VIEW ====================
  const FilieresView = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono text-[#e0e0e6]">
          <span className="text-[#00d4ff] cyan-text">$</span> Filières
        </h1>
        <button onClick={() => { setEditingFiliere({}); setShowFiliereForm(true) }}
          className="px-3 py-2 text-xs rounded-md bg-[#00d4ff] text-[#0a0a0f] font-bold hover:bg-[#00d4ff]/90 transition-all flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nouvelle Filière
        </button>
      </div>

      {filieres.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filieres.map(f => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="neon-border rounded-lg p-5 bg-[#12121a] group hover:border-[rgba(0,212,255,0.3)] transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[#00d4ff] font-bold text-lg font-mono">{f.code}</div>
                  <div className="text-[#e0e0e6] font-mono text-sm">{f.nom}</div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingFiliere(f); setShowFiliereForm(true) }}
                    className="p-1.5 rounded hover:bg-[rgba(0,255,136,0.1)] text-[#6b6b8a] hover:text-[#00ff88]">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteFiliereConfirm(f.id)}
                    className="p-1.5 rounded hover:bg-[rgba(255,68,68,0.1)] text-[#6b6b8a] hover:text-[#ff4444]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {f.description && <p className="text-xs text-[#6b6b8a] font-mono mb-3">{f.description}</p>}
              <div className="flex gap-3 text-xs text-[#4a4a6a] font-mono">
                {f.niveau && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{f.niveau}</span>}
                {f.responsable && <span className="flex items-center gap-1"><User className="w-3 h-3" />{f.responsable}</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <span className="text-[10px] text-[#3a3a5a] font-mono">
                  {students.filter(s => s.filiere === f.nom).length} étudiant(s)
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="neon-border rounded-lg p-16 bg-[#12121a] text-center">
          <GraduationCap className="w-14 h-14 text-[#2a2a4a] mx-auto mb-4" />
          <p className="text-lg text-[#4a4a6a] font-mono mb-2">Aucune filière enregistrée</p>
          <p className="text-sm text-[#3a3a5a] font-mono mb-4">Ajoutez des filières pour organiser les étudiants</p>
          <button onClick={() => { setEditingFiliere({}); setShowFiliereForm(true) }}
            className="px-4 py-2 text-sm rounded-md bg-[#00d4ff] text-[#0a0a0f] font-bold hover:bg-[#00d4ff]/90 transition-all inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter une filière
          </button>
        </div>
      )}
    </div>
  )

  // ==================== DOCUMENTS VIEW ====================
  const DocumentsView = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-mono text-[#e0e0e6]">
          <span className="text-[#ffd93d]">$</span> Documents
        </h1>
        <button onClick={() => setShowDocUpload(true)}
          className="px-3 py-2 text-xs rounded-md bg-[#ffd93d] text-[#0a0a0f] font-bold hover:bg-[#ffd93d]/90 transition-all flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5" /> Ajouter un Document
        </button>
      </div>

      {/* Filters */}
      <div className="neon-border rounded-lg p-3 bg-[#12121a]">
        <div className="flex flex-wrap gap-3 items-center">
          <select className="terminal-input rounded-md px-3 py-2 text-xs bg-[#0a0a0f] text-[#e0e0e6] appearance-none"
            value={docFilterStudent} onChange={e => setDocFilterStudent(e.target.value)}>
            <option value="">Tous les étudiants</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.matricule} - {s.nom} {s.prenom}</option>)}
          </select>
          <select className="terminal-input rounded-md px-3 py-2 text-xs bg-[#0a0a0f] text-[#e0e0e6] appearance-none"
            value={docFilterType} onChange={e => setDocFilterType(e.target.value)}>
            <option value="">Tous les types</option>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(docFilterStudent || docFilterType) && (
            <button onClick={() => { setDocFilterStudent(''); setDocFilterType('') }}
              className="text-xs text-[#ff6b6b] hover:underline font-mono flex items-center gap-1">
              <X className="w-3 h-3" /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      {documents.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="neon-border rounded-lg p-4 bg-[#12121a] group hover:border-[rgba(255,217,61,0.3)] transition-all">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-[rgba(255,217,61,0.1)]">
                  <FileBadge className="w-5 h-5 text-[#ffd93d]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#e0e0e6] font-mono truncate">{doc.titre}</div>
                  <div className="text-[10px] text-[#4a4a6a] font-mono mt-0.5">
                    {doc.type} • {doc.tailleFichier || '—'}
                  </div>
                  {doc.student && (
                    <div className="text-xs text-[#00d4ff] font-mono mt-1.5 truncate">
                      {doc.student.matricule} — {doc.student.nom} {doc.student.prenom}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <a href={doc.fichier} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-[rgba(0,212,255,0.1)] text-[#6b6b8a] hover:text-[#00d4ff] transition-all">
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => handleDeleteDocument(doc.id)}
                  className="p-1.5 rounded hover:bg-[rgba(255,68,68,0.1)] text-[#6b6b8a] hover:text-[#ff4444] transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="neon-border rounded-lg p-16 bg-[#12121a] text-center">
          <FileText className="w-14 h-14 text-[#2a2a4a] mx-auto mb-4" />
          <p className="text-lg text-[#4a4a6a] font-mono mb-2">Aucun document trouvé</p>
          <p className="text-sm text-[#3a3a5a] font-mono mb-4">
            {docFilterStudent || docFilterType
              ? 'Essayez de modifier vos filtres'
              : 'Ajoutez des documents aux dossiers étudiants'}
          </p>
          <button onClick={() => setShowDocUpload(true)}
            className="px-4 py-2 text-sm rounded-md bg-[#ffd93d] text-[#0a0a0f] font-bold hover:bg-[#ffd93d]/90 transition-all inline-flex items-center gap-2">
            <Upload className="w-4 h-4" /> Ajouter un document
          </button>
        </div>
      )}
    </div>
  )

  // ==================== MAIN RENDER ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#00ff88] font-bold text-4xl font-mono neon-text mb-4">CUK</div>
          <div className="flex items-center gap-2 text-[#6b6b8a] font-mono text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Chargement du système<span className="animate-blink">_</span></span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-[#0d0d14] border-r border-[rgba(255,255,255,0.06)] transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        <SidebarContent />
        <div className="p-2 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-2 rounded-md text-[#6b6b8a] hover:text-[#e0e0e6] hover:bg-[rgba(255,255,255,0.03)] transition-all flex items-center justify-center">
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileSidebar(false)} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-[#0d0d14] border-r border-[rgba(255,255,255,0.06)] z-50 lg:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-[rgba(255,255,255,0.06)] bg-[#0d0d14] flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setMobileSidebar(true)} className="lg:hidden text-[#6b6b8a] hover:text-[#e0e0e6]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#6b6b8a] font-mono">
              <span className="text-[#00ff88]">CUK</span>
              <span>/</span>
              <span className="text-[#e0e0e6]">{navItems.find(n => n.id === activeView)?.label}</span>
              {selectedStudent && (
                <>
                  <span>/</span>
                  <span className="text-[#00d4ff]">{selectedStudent.nom} {selectedStudent.prenom}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-[#4a4a6a] font-mono hidden sm:block">
              Centre Universitaire de Koulamoutou
            </div>
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={activeView + (selectedStudent?.id || '')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {activeView === 'dashboard' && <DashboardView />}
              {activeView === 'students' && <StudentsView />}
              {activeView === 'filieres' && <FilieresView />}
              {activeView === 'documents' && <DocumentsView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ==================== MODALS ==================== */}

      {/* Student Form Modal */}
      <AnimatePresence>
        {showStudentForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowStudentForm(false); setEditingStudent(emptyStudent) }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] rounded-lg border border-[rgba(0,255,136,0.2)] bg-[#12121a] p-6 overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-mono text-[#00ff88] neon-text">
                  {editingStudent.id ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}
                </h2>
                <button onClick={() => { setShowStudentForm(false); setEditingStudent(emptyStudent) }}
                  className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.05)] text-[#6b6b8a] hover:text-[#e0e0e6]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <StudentForm
                student={editingStudent}
                filieres={filieres}
                onSave={handleSaveStudent}
                onCancel={() => { setShowStudentForm(false); setEditingStudent(emptyStudent) }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Student Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-lg border border-[rgba(255,68,68,0.3)] bg-[#12121a] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-[rgba(255,68,68,0.1)]">
                  <AlertCircle className="w-5 h-5 text-[#ff4444]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-[#e0e0e6]">Confirmer la suppression</h3>
                  <p className="text-xs text-[#6b6b8a] font-mono mt-1">Cette action est irréversible. Tous les documents associés seront supprimés.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-2 text-xs rounded-md border border-[rgba(255,255,255,0.1)] text-[#6b6b8a] hover:text-[#e0e0e6] transition-all">
                  Annuler
                </button>
                <button onClick={() => handleDeleteStudent(deleteConfirm)}
                  className="px-3 py-2 text-xs rounded-md bg-[#ff4444] text-white font-bold hover:bg-[#ff4444]/90 transition-all">
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filiere Form Modal */}
      <AnimatePresence>
        {showFiliereForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowFiliereForm(false); setEditingFiliere({}) }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-lg border border-[rgba(0,212,255,0.2)] bg-[#12121a] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-mono text-[#00d4ff] cyan-text">
                  {editingFiliere.id ? 'Modifier la filière' : 'Nouvelle filière'}
                </h2>
                <button onClick={() => { setShowFiliereForm(false); setEditingFiliere({}) }}
                  className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.05)] text-[#6b6b8a] hover:text-[#e0e0e6]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <FiliereForm
                filiere={editingFiliere}
                onSave={handleSaveFiliere}
                onCancel={() => { setShowFiliereForm(false); setEditingFiliere({}) }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Filiere Confirm */}
      <AnimatePresence>
        {deleteFiliereConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteFiliereConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-lg border border-[rgba(255,68,68,0.3)] bg-[#12121a] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-md bg-[rgba(255,68,68,0.1)]">
                  <AlertCircle className="w-5 h-5 text-[#ff4444]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-[#e0e0e6]">Supprimer cette filière ?</h3>
                  <p className="text-xs text-[#6b6b8a] font-mono mt-1">Les étudiants associés ne seront pas supprimés.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteFiliereConfirm(null)}
                  className="px-3 py-2 text-xs rounded-md border border-[rgba(255,255,255,0.1)] text-[#6b6b8a] hover:text-[#e0e0e6] transition-all">
                  Annuler
                </button>
                <button onClick={() => handleDeleteFiliere(deleteFiliereConfirm)}
                  className="px-3 py-2 text-xs rounded-md bg-[#ff4444] text-white font-bold hover:bg-[#ff4444]/90 transition-all">
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Upload Modal */}
      <AnimatePresence>
        {showDocUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDocUpload(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-lg border border-[rgba(255,217,61,0.2)] bg-[#12121a] p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-mono text-[#ffd93d]">Ajouter un document</h2>
                <button onClick={() => setShowDocUpload(false)}
                  className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.05)] text-[#6b6b8a] hover:text-[#e0e0e6]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#6b6b8a] uppercase tracking-wider">Étudiant *</label>
                  <select className="terminal-input w-full rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6] appearance-none"
                    value={docUploadForm.etudiantId} onChange={e => setDocUploadForm(p => ({ ...p, etudiantId: e.target.value }))} required>
                    <option value="">— Sélectionner —</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.matricule} — {s.nom} {s.prenom}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#6b6b8a] uppercase tracking-wider">Titre *</label>
                  <input className="terminal-input w-full rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6] placeholder:text-[#4a4a6a]"
                    value={docUploadForm.titre} onChange={e => setDocUploadForm(p => ({ ...p, titre: e.target.value }))} placeholder="Nom du document" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#6b6b8a] uppercase tracking-wider">Type *</label>
                  <select className="terminal-input w-full rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6] appearance-none"
                    value={docUploadForm.type} onChange={e => setDocUploadForm(p => ({ ...p, type: e.target.value }))} required>
                    <option value="">— Sélectionner —</option>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#6b6b8a] uppercase tracking-wider">Fichier *</label>
                  <input type="file" className="terminal-input w-full rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-[#e0e0e6]"
                    onChange={e => setDocFile(e.target.files?.[0] || null)} required />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <button type="button" onClick={() => setShowDocUpload(false)}
                    className="px-3 py-2 text-xs rounded-md border border-[rgba(255,255,255,0.1)] text-[#6b6b8a] hover:text-[#e0e0e6] transition-all">
                    Annuler
                  </button>
                  <button type="submit" disabled={uploadingDoc}
                    className="px-3 py-2 text-xs rounded-md bg-[#ffd93d] text-[#0a0a0f] font-bold hover:bg-[#ffd93d]/90 transition-all disabled:opacity-50 flex items-center gap-2">
                    {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Télécharger
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
