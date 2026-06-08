import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const etudiantId = searchParams.get('etudiantId') || ''
    const type = searchParams.get('type') || ''

    const where: Record<string, unknown> = {}

    if (etudiantId) {
      where.etudiantId = etudiantId
    }

    if (type) {
      where.type = type
    }

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { student: { select: { id: true, nom: true, prenom: true, matricule: true } } },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des documents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const titre = formData.get('titre') as string
    const type = formData.get('type') as string
    const etudiantId = formData.get('etudiantId') as string
    const fichier = formData.get('fichier') as File

    if (!titre || !type || !etudiantId || !fichier) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Save file
    const bytes = await fichier.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${fichier.name}`
    const filePath = `/uploads/documents/${fileName}`

    const { writeFileSync } = await import('fs')
    const { join } = await import('path')
    const fullPath = join(process.cwd(), 'public', filePath)
    writeFileSync(fullPath, buffer)

    const document = await db.document.create({
      data: {
        titre,
        type,
        fichier: filePath,
        tailleFichier: `${(fichier.size / 1024).toFixed(1)} KB`,
        etudiantId,
      },
      include: { student: { select: { id: true, nom: true, prenom: true, matricule: true } } },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du document' }, { status: 500 })
  }
}
