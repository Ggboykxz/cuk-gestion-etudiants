import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search')
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '0')
    const gender = req.nextUrl.searchParams.get('gender')
    
    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { nom: { contains: search } },
        { prenom: { contains: search } },
        { matricule: { contains: search } },
      ]
    }
    if (gender) {
      where.sexe = gender
    }

    const total = await db.student.count({ where })

    const students = await db.student.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        inscriptions: {
          include: {
            promotion: {
              include: { filiere: true }
            },
            notes: { include: { matiere: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        documents: true
      },
      orderBy: { nom: 'asc' },
      ...(limit > 0 ? { skip: (page - 1) * limit, take: limit } : {}),
    })

    if (limit > 0) {
      return NextResponse.json({ data: students, total, page, limit, totalPages: Math.ceil(total / limit) })
    }

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des étudiants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const existing = await db.student.findUnique({
      where: { matricule: body.matricule }
    })
    if (existing) {
      return NextResponse.json({ error: 'Un étudiant avec ce matricule existe déjà' }, { status: 400 })
    }

    const student = await db.student.create({
      data: {
        matricule: body.matricule,
        nom: body.nom,
        prenom: body.prenom,
        dateNaissance: body.dateNaissance,
        lieuNaissance: body.lieuNaissance,
        sexe: body.sexe,
        nationalite: body.nationalite || 'Gabonaise',
        photo: body.photo,
        telephone: body.telephone,
        email: body.email,
        adresse: body.adresse,
        nomPere: body.nomPere,
        nomMere: body.nomMere,
        telephonePere: body.telephonePere,
        telephoneMere: body.telephoneMere,
        adresseParents: body.adresseParents,
        personneContact: body.personneContact,
        telephoneContact: body.telephoneContact,
        lienParente: body.lienParente,
        etablissementOrigine: body.etablissementOrigine,
        diplomeOrigine: body.diplomeOrigine,
        anneeObtentionDiplome: body.anneeObtentionDiplome,
        bourse: body.bourse,
        chambre: body.chambre,
      }
    })

    return NextResponse.json(student, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Erreur lors de la création de l\'étudiant' }, { status: 500 })
  }
}
