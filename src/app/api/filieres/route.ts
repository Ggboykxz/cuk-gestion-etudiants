import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const filieres = await db.filiere.findMany({
      include: {
        _count: { select: { promotions: true, matieres: true } }
      },
      orderBy: { code: 'asc' }
    })
    return NextResponse.json(filieres)
  } catch (error) {
    console.error('Error fetching filieres:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des filières' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const existing = await db.filiere.findUnique({
      where: { code: body.code }
    })
    if (existing) {
      return NextResponse.json({ error: 'Une filière avec ce code existe déjà' }, { status: 400 })
    }

    const filiere = await db.filiere.create({
      data: {
        code: body.code,
        nom: body.nom,
        description: body.description,
        niveau: body.niveau,
        responsable: body.responsable,
      }
    })

    return NextResponse.json(filiere, { status: 201 })
  } catch (error) {
    console.error('Error creating filiere:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la filière' }, { status: 500 })
  }
}
