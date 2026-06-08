import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const filiere = searchParams.get('filiere') || ''
    const niveau = searchParams.get('niveau') || ''
    const statut = searchParams.get('statut') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { matricule: { contains: search } },
        { nom: { contains: search } },
        { prenom: { contains: search } },
        { email: { contains: search } },
        { telephone: { contains: search } },
      ]
    }

    if (filiere) {
      where.filiere = filiere
    }

    if (niveau) {
      where.niveau = niveau
    }

    if (statut) {
      where.statut = statut
    }

    const students = await db.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { documents: true },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des étudiants' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Check if matricule already exists
    const existing = await db.student.findUnique({
      where: { matricule: body.matricule },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ce matricule existe déjà' }, { status: 400 })
    }

    const student = await db.student.create({
      data: {
        matricule: body.matricule,
        nom: body.nom,
        prenom: body.prenom,
        dateNaissance: body.dateNaissance || null,
        lieuNaissance: body.lieuNaissance || null,
        sexe: body.sexe || null,
        nationalite: body.nationalite || 'Gabonaise',
        photo: body.photo || null,
        telephone: body.telephone || null,
        email: body.email || null,
        adresse: body.adresse || null,
        nomPere: body.nomPere || null,
        nomMere: body.nomMere || null,
        telephonePere: body.telephonePere || null,
        telephoneMere: body.telephoneMere || null,
        adresseParents: body.adresseParents || null,
        personneContact: body.personneContact || null,
        telephoneContact: body.telephoneContact || null,
        lienParente: body.lienParente || null,
        filiere: body.filiere || null,
        niveau: body.niveau || null,
        anneeInscription: body.anneeInscription || null,
        statut: body.statut || 'Actif',
        numeroDossier: body.numeroDossier || null,
        etablissementOrigine: body.etablissementOrigine || null,
        diplomeOrigine: body.diplomeOrigine || null,
        anneeObtentionDiplome: body.anneeObtentionDiplome || null,
        bourse: body.bourse || null,
        chambre: body.chambre || null,
      },
      include: { documents: true },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de l\'étudiant' }, { status: 500 })
  }
}
