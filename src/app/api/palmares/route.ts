import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function getMention(moyenne: number): string {
  if (moyenne >= 16) return 'Très Bien'
  if (moyenne >= 14) return 'Bien'
  if (moyenne >= 12) return 'Assez Bien'
  if (moyenne >= 10) return 'Passable'
  return 'Ajourné'
}

export async function GET(req: NextRequest) {
  try {
    const promotionId = req.nextUrl.searchParams.get('promotionId')
    if (!promotionId) {
      return NextResponse.json({ error: 'promotionId est requis' }, { status: 400 })
    }

    const promotion = await db.promotion.findUnique({
      where: { id: promotionId },
      include: {
        filiere: true,
        inscriptions: {
          include: {
            student: true,
            notes: { include: { matiere: true } }
          }
        },
        matieres: { orderBy: [{ semestre: 'asc' }, { nom: 'asc' }] }
      }
    })

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 })
    }

    const palmares = promotion.inscriptions.map(inscription => {
      const notesS1 = inscription.notes.filter(n => n.matiere.semestre === 1)
      const notesS2 = inscription.notes.filter(n => n.matiere.semestre === 2)

      const calcSemesterAvg = (notes: typeof inscription.notes) => {
        if (notes.length === 0) return null
        let totalWeighted = 0
        let totalCoef = 0
        for (const note of notes) {
          if (note.moyenne !== null && note.moyenne !== undefined) {
            totalWeighted += note.moyenne * note.matiere.coefficient
            totalCoef += note.matiere.coefficient
          }
        }
        return totalCoef > 0 ? Math.round((totalWeighted / totalCoef) * 100) / 100 : null
      }

      const moyenneS1 = calcSemesterAvg(notesS1)
      const moyenneS2 = calcSemesterAvg(notesS2)

      let moyenneAnnuelle: number | null = null
      if (moyenneS1 !== null && moyenneS2 !== null) {
        moyenneAnnuelle = Math.round(((moyenneS1 + moyenneS2) / 2) * 100) / 100
      } else if (moyenneS1 !== null) {
        moyenneAnnuelle = moyenneS1
      } else if (moyenneS2 !== null) {
        moyenneAnnuelle = moyenneS2
      }

      const mention = moyenneAnnuelle !== null ? getMention(moyenneAnnuelle) : '-'

      const totalCredits = inscription.notes.reduce((sum, n) => {
        if (n.moyenne !== null && n.moyenne >= 10) {
          return sum + n.matiere.coefficient
        }
        return sum
      }, 0)

      return {
        inscriptionId: inscription.id,
        studentId: inscription.studentId,
        matricule: inscription.student.matricule,
        nom: inscription.student.nom,
        prenom: inscription.student.prenom,
        redoublant: inscription.redoublant,
        notes: inscription.notes.map(n => ({
          matiereId: n.matiereId,
          matiereNom: n.matiere.nom,
          matiereCode: n.matiere.code,
          coefficient: n.matiere.coefficient,
          semestre: n.matiere.semestre,
          noteCC: n.noteCC,
          noteExam: n.noteExam,
          noteTP: n.noteTP,
          moyenne: n.moyenne,
        })),
        moyenneS1,
        moyenneS2,
        moyenneAnnuelle,
        totalCredits,
        mention,
      }
    })

    palmares.sort((a, b) => {
      const ma = a.moyenneAnnuelle ?? -1
      const mb = b.moyenneAnnuelle ?? -1
      return mb - ma
    })

    const ranked = palmares.map((p, i) => ({ ...p, rang: i + 1 }))

    const classAvg = ranked.length > 0
      ? Math.round((ranked.reduce((s, p) => s + (p.moyenneAnnuelle ?? 0), 0) / ranked.length) * 100) / 100
      : 0

    const passRate = ranked.length > 0
      ? Math.round((ranked.filter(p => p.moyenneAnnuelle !== null && p.moyenneAnnuelle >= 10).length / ranked.length) * 100)
      : 0

    const mentionDistribution: Record<string, number> = {}
    for (const p of ranked) {
      const m = p.mention
      mentionDistribution[m] = (mentionDistribution[m] || 0) + 1
    }

    return NextResponse.json({
      promotion: {
        id: promotion.id,
        anneeScolaire: promotion.anneeScolaire,
        niveau: promotion.niveau,
        statut: promotion.statut,
        dateCloture: promotion.dateCloture,
        filiere: promotion.filiere,
      },
      palmares: ranked,
      statistics: {
        classAvg,
        passRate,
        totalStudents: ranked.length,
        mentionDistribution,
      }
    })
  } catch (error) {
    console.error('Error generating palmares:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du palmarès' }, { status: 500 })
  }
}
