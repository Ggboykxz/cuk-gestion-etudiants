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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const note = await db.note.findUnique({
      where: { id },
      include: { inscription: { include: { promotion: true } } }
    })
    if (!note) {
      return NextResponse.json({ error: 'Note non trouvée' }, { status: 404 })
    }
    if (note.inscription.promotion.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Année clôturée — Modification impossible' }, { status: 403 })
    }

    const moyenne = calculateMoyenne(body.noteCC ?? null, body.noteExam ?? null, body.noteTP ?? null)

    const updated = await db.note.update({
      where: { id },
      data: {
        noteCC: body.noteCC,
        noteExam: body.noteExam,
        noteTP: body.noteTP,
        moyenne,
        observation: body.observation,
      },
      include: { inscription: { include: { student: true } }, matiere: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating note:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la note' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const note = await db.note.findUnique({
      where: { id },
      include: { inscription: { include: { promotion: true } } }
    })
    if (!note) {
      return NextResponse.json({ error: 'Note non trouvée' }, { status: 404 })
    }
    if (note.inscription.promotion.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Année clôturée — Suppression impossible' }, { status: 403 })
    }

    await db.note.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la note' }, { status: 500 })
  }
}
