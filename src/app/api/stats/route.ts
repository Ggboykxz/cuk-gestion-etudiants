import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const totalStudents = await db.student.count()
    
    const totalPromotions = await db.promotion.count()
    const activePromotions = await db.promotion.count({ where: { statut: 'En cours' } })
    const closedPromotions = await db.promotion.count({ where: { statut: 'Clôturée' } })
    
    const totalInscriptions = await db.inscription.count()
    
    const dossierByStatus = await db.inscription.groupBy({
      by: ['statutDossier'],
      _count: true,
    })

    const inscriptionsByFiliere = await db.inscription.findMany({
      include: {
        promotion: { include: { filiere: true } }
      }
    })

    const filiereCounts: Record<string, number> = {}
    for (const ins of inscriptionsByFiliere) {
      const name = ins.promotion?.filiere?.nom || 'Non assigné'
      filiereCounts[name] = (filiereCounts[name] || 0) + 1
    }

    const recentInscriptions = await db.inscription.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: true,
        promotion: { include: { filiere: true } }
      }
    })

    const dossiersComplets = await db.inscription.count({ 
      where: { statutDossier: 'Complet' } 
    })
    const dossiersValidés = await db.inscription.count({ 
      where: { statutDossier: 'Validé' } 
    })

    const totalFilieres = await db.filiere.count()

    const tauxReussite = totalInscriptions > 0
      ? Math.round(((dossiersComplets + dossiersValidés) / totalInscriptions) * 100)
      : 0

    // Activity feed - last 10 actions
    const recentStudents = await db.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    })
    const recentPromos = await db.promotion.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { filiere: true }
    })
    const recentNotes = await db.note.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        inscription: { include: { student: true } },
        matiere: true
      }
    })

    const activityFeed = [
      ...recentInscriptions.slice(0, 3).map(ins => ({
        type: 'inscription' as const,
        message: `${ins.student?.nom} ${ins.student?.prenom} inscrit en ${ins.promotion?.filiere?.nom} ${ins.promotion?.niveau}`,
        date: ins.createdAt,
        icon: 'user-plus'
      })),
      ...recentStudents.map(s => ({
        type: 'student' as const,
        message: `${s.nom} ${s.prenom} (${s.matricule}) ajouté`,
        date: s.createdAt,
        icon: 'user'
      })),
      ...recentPromos.map(p => ({
        type: 'promotion' as const,
        message: `Promotion ${p.filiere?.nom} ${p.niveau} (${p.anneeScolaire}) créée`,
        date: p.createdAt,
        icon: 'graduation'
      })),
      ...recentNotes.map(n => ({
        type: 'note' as const,
        message: `Note saisie pour ${n.inscription?.student?.nom} en ${n.matiere?.nom}`,
        date: n.createdAt,
        icon: 'note'
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    // Taux de réussite from palmarès data
    const allNotes = await db.note.findMany({
      where: { moyenne: { not: null } },
      include: { inscription: true }
    })
    const inscriptionsWithMoyenne = new Map<string, number[]>()
    for (const note of allNotes) {
      if (note.moyenne !== null) {
        if (!inscriptionsWithMoyenne.has(note.inscriptionId)) {
          inscriptionsWithMoyenne.set(note.inscriptionId, [])
        }
        inscriptionsWithMoyenne.get(note.inscriptionId)!.push(note.moyenne)
      }
    }
    
    let studentsWithAvg = 0
    let studentsPassing = 0
    for (const [, notes] of inscriptionsWithMoyenne) {
      if (notes.length > 0) {
        studentsWithAvg++
        const avg = notes.reduce((a, b) => a + b, 0) / notes.length
        if (avg >= 10) studentsPassing++
      }
    }
    const tauxReussiteAcademic = studentsWithAvg > 0 ? Math.round((studentsPassing / studentsWithAvg) * 100) : 0

    // Dossier completeness
    const totalDossiers = await db.inscription.count()
    const completeDossiers = dossiersComplets + dossiersValidés
    const dossierCompleteness = totalDossiers > 0 ? Math.round((completeDossiers / totalDossiers) * 100) : 0

    // Grade entry progress per active promotion
    const activePromosData = await db.promotion.findMany({
      where: { statut: 'En cours' },
      include: {
        _count: { select: { inscriptions: true, matieres: true } },
        filiere: true,
        matieres: { include: { _count: { select: { notes: true } } } }
      }
    })
    const gradeEntryProgress = activePromosData.map(p => {
      const totalNeeded = p._count.inscriptions * p._count.matieres
      const totalEntered = p.matieres.reduce((sum, m) => sum + m._count.notes, 0)
      return {
        promotionId: p.id,
        filiereNom: p.filiere.nom,
        niveau: p.niveau,
        anneeScolaire: p.anneeScolaire,
        totalNeeded,
        totalEntered,
        progress: totalNeeded > 0 ? Math.round((totalEntered / totalNeeded) * 100) : 0
      }
    })

    return NextResponse.json({
      totalStudents,
      totalPromotions,
      activePromotions,
      closedPromotions,
      totalInscriptions,
      totalFilieres,
      dossierByStatus: dossierByStatus.map(d => ({
        statut: d.statutDossier || 'Non défini',
        count: d._count,
      })),
      filiereCounts,
      recentInscriptions,
      tauxReussite,
      tauxReussiteAcademic,
      activityFeed,
      dossierCompleteness,
      gradeEntryProgress,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des statistiques' }, { status: 500 })
  }
}
