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
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des statistiques' }, { status: 500 })
  }
}
