import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const inscription = await db.inscription.findUnique({
      where: { id },
      include: {
        student: true,
        promotion: { include: { filiere: true } },
        notes: { include: { matiere: true } }
      }
    })

    if (!inscription) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    return NextResponse.json(inscription)
  } catch (error) {
    console.error('Error fetching inscription:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement de l\'inscription' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const inscription = await db.inscription.findUnique({
      where: { id },
      include: { promotion: true }
    })
    if (!inscription) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }
    if (inscription.promotion.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Année clôturée — Modification impossible' }, { status: 403 })
    }

    const updated = await db.inscription.update({
      where: { id },
      data: {
        numeroDossier: body.numeroDossier,
        statutDossier: body.statutDossier,
        statut: body.statut,
        redoublant: body.redoublant,
      },
      include: {
        student: true,
        promotion: { include: { filiere: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating inscription:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'inscription' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const inscription = await db.inscription.findUnique({
      where: { id },
      include: { promotion: true }
    })
    if (!inscription) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }
    if (inscription.promotion.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Année clôturée — Suppression impossible' }, { status: 403 })
    }

    await db.inscription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inscription:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l\'inscription' }, { status: 500 })
  }
}
