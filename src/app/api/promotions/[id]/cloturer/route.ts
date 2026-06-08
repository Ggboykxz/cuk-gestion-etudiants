import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const promotion = await db.promotion.findUnique({ where: { id } })
    if (!promotion) {
      return NextResponse.json({ error: 'Promotion non trouvée' }, { status: 404 })
    }
    if (promotion.statut === 'Clôturée') {
      return NextResponse.json({ error: 'Cette promotion est déjà clôturée' }, { status: 400 })
    }

    const now = new Date()
    const dateCloture = now.toLocaleDateString('fr-FR', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    })

    const updated = await db.promotion.update({
      where: { id },
      data: {
        statut: 'Clôturée',
        dateCloture: dateCloture,
      },
      include: { filiere: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error closing promotion:', error)
    return NextResponse.json({ error: 'Erreur lors de la clôture de la promotion' }, { status: 500 })
  }
}
