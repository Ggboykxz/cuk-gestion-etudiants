import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const anneeScolaire = req.nextUrl.searchParams.get('anneeScolaire')
    const filiereId = req.nextUrl.searchParams.get('filiereId')
    const niveau = req.nextUrl.searchParams.get('niveau')
    const statut = req.nextUrl.searchParams.get('statut')

    const promotions = await db.promotion.findMany({
      where: {
        anneeScolaire: anneeScolaire || undefined,
        filiereId: filiereId || undefined,
        niveau: niveau || undefined,
        statut: statut || undefined,
      },
      include: {
        filiere: true,
        _count: { select: { inscriptions: true, matieres: true } }
      },
      orderBy: [{ anneeScolaire: 'desc' }, { niveau: 'asc' }]
    })

    return NextResponse.json(promotions)
  } catch (error) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des promotions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const existing = await db.promotion.findUnique({
      where: {
        filiereId_anneeScolaire_niveau: {
          filiereId: body.filiereId,
          anneeScolaire: body.anneeScolaire,
          niveau: body.niveau,
        }
      }
    })
    if (existing) {
      return NextResponse.json({ error: 'Cette promotion existe déjà' }, { status: 400 })
    }

    const promotion = await db.promotion.create({
      data: {
        filiereId: body.filiereId,
        anneeScolaire: body.anneeScolaire,
        niveau: body.niveau,
        statut: 'En cours',
      },
      include: { filiere: true }
    })

    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    console.error('Error creating promotion:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la promotion' }, { status: 500 })
  }
}
