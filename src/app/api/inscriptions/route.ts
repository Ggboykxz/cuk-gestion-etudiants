import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const promotionId = req.nextUrl.searchParams.get('promotionId')
    const studentId = req.nextUrl.searchParams.get('studentId')
    const statutDossier = req.nextUrl.searchParams.get('statutDossier')

    const inscriptions = await db.inscription.findMany({
      where: {
        promotionId: promotionId || undefined,
        studentId: studentId || undefined,
        statutDossier: statutDossier || undefined,
      },
      include: {
        student: true,
        promotion: { include: { filiere: true } },
        notes: { include: { matiere: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(inscriptions)
  } catch (error) {
    console.error('Error fetching inscriptions:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des inscriptions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const existing = await db.inscription.findUnique({
      where: {
        studentId_promotionId: {
          studentId: body.studentId,
          promotionId: body.promotionId,
        }
      }
    })
    if (existing) {
      return NextResponse.json({ error: 'Cet étudiant est déjà inscrit dans cette promotion' }, { status: 400 })
    }

    const inscription = await db.inscription.create({
      data: {
        studentId: body.studentId,
        promotionId: body.promotionId,
        numeroDossier: body.numeroDossier,
        statutDossier: body.statutDossier || 'Incomplet',
        statut: body.statut || 'Actif',
        redoublant: body.redoublant || false,
      },
      include: {
        student: true,
        promotion: { include: { filiere: true } }
      }
    })

    return NextResponse.json(inscription, { status: 201 })
  } catch (error) {
    console.error('Error creating inscription:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de l\'inscription' }, { status: 500 })
  }
}
