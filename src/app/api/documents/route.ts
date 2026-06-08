import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const etudiantId = req.nextUrl.searchParams.get('etudiantId')
    const type = req.nextUrl.searchParams.get('type')

    const documents = await db.document.findMany({
      where: {
        etudiantId: etudiantId || undefined,
        type: type || undefined,
      },
      include: {
        student: { select: { id: true, nom: true, prenom: true, matricule: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const document = await db.document.create({
      data: {
        titre: body.titre,
        type: body.type,
        fichier: body.fichier,
        tailleFichier: body.tailleFichier,
        etudiantId: body.etudiantId,
      },
      include: {
        student: { select: { id: true, nom: true, prenom: true, matricule: true } }
      }
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'ajout du document' }, { status: 500 })
  }
}
