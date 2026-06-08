import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

function calculateMoyenne(noteCC: number | null, noteExam: number | null, noteTP: number | null): number | null {
  const hasCC = noteCC !== null && noteCC !== undefined
  const hasExam = noteExam !== null && noteExam !== undefined
  const hasTP = noteTP !== null && noteTP !== undefined

  if (!hasCC && !hasExam && !hasTP) return null

  if (hasCC && hasExam && hasTP) {
    return Math.round((noteCC * 0.3 + noteExam * 0.5 + noteTP * 0.2) * 100) / 100
  }

  let total = 0
  let weight = 0
  if (hasCC) { total += noteCC * 0.3; weight += 0.3 }
  if (hasExam) { total += noteExam * 0.5; weight += 0.5 }
  if (hasTP) { total += noteTP * 0.2; weight += 0.2 }

  return weight > 0 ? Math.round((total / weight) * 100) / 100 : null
}

export async function GET(req: NextRequest) {
  try {
    const inscriptionId = req.nextUrl.searchParams.get('inscriptionId')
    const matiereId = req.nextUrl.searchParams.get('matiereId')

    const notes = await db.note.findMany({
      where: {
        inscriptionId: inscriptionId || undefined,
        matiereId: matiereId || undefined,
      },
      include: {
        inscription: { include: { student: true, promotion: { include: { filiere: true } } } },
        matiere: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des notes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const inscription = await db.inscription.findUnique({
      where: { id: body.inscriptionId },
      include: { promotion: true }
    })
    if (!inscription) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }
    if (inscription.promotion.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Année clôturée — Saisie de notes impossible' }, { status: 403 })
    }

    const moyenne = calculateMoyenne(body.noteCC ?? null, body.noteExam ?? null, body.noteTP ?? null)

    const note = await db.note.upsert({
      where: {
        inscriptionId_matiereId: {
          inscriptionId: body.inscriptionId,
          matiereId: body.matiereId,
        }
      },
      create: {
        inscriptionId: body.inscriptionId,
        matiereId: body.matiereId,
        noteCC: body.noteCC,
        noteExam: body.noteExam,
        noteTP: body.noteTP,
        moyenne,
        observation: body.observation,
      },
      update: {
        noteCC: body.noteCC,
        noteExam: body.noteExam,
        noteTP: body.noteTP,
        moyenne,
        observation: body.observation,
      },
      include: {
        inscription: { include: { student: true } },
        matiere: true,
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating note:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de la note' }, { status: 500 })
  }
}
