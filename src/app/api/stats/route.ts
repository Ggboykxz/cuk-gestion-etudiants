import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const totalStudents = await db.student.count()
    const totalFilieres = await db.filiere.count()
    const totalDocuments = await db.document.count()
    const activeStudents = await db.student.count({
      where: { statut: 'Actif' },
    })

    // Students by filière
    const byFiliere = await db.student.groupBy({
      by: ['filiere'],
      _count: { filiere: true },
      where: { filiere: { not: null } },
    })

    // Students by niveau
    const byNiveau = await db.student.groupBy({
      by: ['niveau'],
      _count: { niveau: true },
      where: { niveau: { not: null } },
    })

    // Students by statut
    const byStatut = await db.student.groupBy({
      by: ['statut'],
      _count: { statut: true },
      where: { statut: { not: null } },
    })

    // Students by sexe
    const bySexe = await db.student.groupBy({
      by: ['sexe'],
      _count: { sexe: true },
      where: { sexe: { not: null } },
    })

    // Recent students
    const recentStudents = await db.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      totalStudents,
      totalFilieres,
      totalDocuments,
      activeStudents,
      byFiliere: byFiliere.map((item) => ({ name: item.filiere, count: item._count.filiere })),
      byNiveau: byNiveau.map((item) => ({ name: item.niveau, count: item._count.niveau })),
      byStatut: byStatut.map((item) => ({ name: item.statut, count: item._count.statut })),
      bySexe: bySexe.map((item) => ({ name: item.sexe, count: item._count.sexe })),
      recentStudents,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 })
  }
}
