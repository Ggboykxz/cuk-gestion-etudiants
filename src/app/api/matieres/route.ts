import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const filiereId = req.nextUrl.searchParams.get('filiereId')
    const promotionId = req.nextUrl.searchParams.get('promotionId')
    const semestre = req.nextUrl.searchParams.get('semestre')

    const matieres = await db.matiere.findMany({
      where: {
        filiereId: filiereId || undefined,
        promotionId: promotionId || undefined,
        semestre: semestre ? parseInt(semestre) : undefined,
      },
      include: {
        filiere: true,
        promotion: true,
        _count: { select: { notes: true } }
      },
      orderBy: [{ semestre: 'asc' }, { nom: 'asc' }]
    })

    return NextResponse.json(matieres)
  } catch (error) {
    console.error('Error fetching matieres:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des matières' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const existing = await db.matiere.findUnique({
      where: {
        code_filiereId: {
          code: body.code,
          filiereId: body.filiereId,
        }
      }
    })
    if (existing) {
      return NextResponse.json({ error: 'Une matière avec ce code existe déjà dans cette filière' }, { status: 400 })
    }

    const matiere = await db.matiere.create({
      data: {
        code: body.code,
        nom: body.nom,
        coefficient: body.coefficient || 1,
        semestre: body.semestre || 1,
        filiereId: body.filiereId,
        promotionId: body.promotionId,
      },
      include: { filiere: true, promotion: true }
    })

    return NextResponse.json(matiere, { status: 201 })
  } catch (error) {
    console.error('Error creating matiere:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de la matière' }, { status: 500 })
  }
}
