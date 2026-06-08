import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const matiere = await db.matiere.findUnique({
      where: { id },
      include: { promotion: true }
    })
    if (!matiere) {
      return NextResponse.json({ error: 'Matière non trouvée' }, { status: 404 })
    }
    if (matiere.promotion?.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Année clôturée — Modification impossible' }, { status: 403 })
    }

    const updated = await db.matiere.update({
      where: { id },
      data: {
        code: body.code,
        nom: body.nom,
        coefficient: body.coefficient,
        semestre: body.semestre,
        promotionId: body.promotionId,
      },
      include: { filiere: true, promotion: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating matiere:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la matière' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const matiere = await db.matiere.findUnique({
      where: { id },
      include: { promotion: true }
    })
    if (!matiere) {
      return NextResponse.json({ error: 'Matière non trouvée' }, { status: 404 })
    }
    if (matiere.promotion?.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Année clôturée — Suppression impossible' }, { status: 403 })
    }

    await db.matiere.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting matiere:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la matière' }, { status: 500 })
  }
}
