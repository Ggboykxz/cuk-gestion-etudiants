import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const promotion = await db.promotion.findUnique({
      where: { id },
      include: {
        filiere: true,
        inscriptions: {
          include: {
            student: true,
            notes: { include: { matiere: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        matieres: { orderBy: [{ semestre: 'asc' }, { nom: 'asc' }] }
      }
    })

    if (!promotion) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 })
    }

    return NextResponse.json(promotion)
  } catch (error) {
    console.error('Error fetching promotion:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement de la promotion' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const promotion = await db.promotion.update({
      where: { id },
      data: {
        anneeScolaire: body.anneeScolaire,
        niveau: body.niveau,
        statut: body.statut,
        dateCloture: body.dateCloture,
      },
      include: { filiere: true }
    })

    return NextResponse.json(promotion)
  } catch (error) {
    console.error('Error updating promotion:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la promotion' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const promotion = await db.promotion.findUnique({ where: { id } })
    if (!promotion) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 })
    }
    if (promotion.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Impossible de supprimer une promotion clôturée' }, { status: 400 })
    }

    await db.promotion.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting promotion:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de la promotion' }, { status: 500 })
  }
}
