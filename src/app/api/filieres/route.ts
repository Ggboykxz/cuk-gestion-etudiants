import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const filieres = await db.filiere.findMany({
      orderBy: { code: 'asc' },
    })

    return NextResponse.json(filieres)
  } catch (error) {
    console.error('Error fetching filières:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des filières' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Check if code already exists
    const existing = await db.filiere.findUnique({
      where: { code: body.code },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ce code de filière existe déjà' }, { status: 400 })
    }

    const filiere = await db.filiere.create({
      data: {
        code: body.code,
        nom: body.nom,
        description: body.description || null,
        niveau: body.niveau || null,
        responsable: body.responsable || null,
      },
    })

    return NextResponse.json(filiere, { status: 201 })
  } catch (error) {
    console.error('Error creating filière:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la filière' }, { status: 500 })
  }
}
