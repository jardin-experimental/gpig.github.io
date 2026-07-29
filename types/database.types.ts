// Écrit à la main pour débloquer le build. À terme, remplacer par :
// npx supabase gen types typescript --project-id <id> > types/database.types.ts
// (une fois le projet Supabase lié et les migrations poussées) — voir note
// "Prochaine étape" en fin de fichier.

export type UserRole =
  | 'visiteur'
  | 'membre'
  | 'etudiant'
  | 'client'
  | 'coach'
  | 'administrateur'

export type LeconType = 'video' | 'exercice' | 'quiz' | 'telechargement' | 'texte'
export type EnrollmentSource = 'achat' | 'offert' | 'abonnement'
export type QuestionType =
  | 'qcm'
  | 'choix_multiple'
  | 'vrai_faux'
  | 'texte_libre'
  | 'association'
  | 'ordonnancement'
  | 'image'
  | 'code'
export type OrderType = 'formation' | 'abonnement' | 'pack' | 'bon_cadeau'
export type OrderStatut = 'en_attente' | 'paye' | 'rembourse' | 'echoue'
export type SubscriptionStatut = 'active' | 'en_pause' | 'annulee' | 'impayee'
export type BadgeConditionType =
  | 'lecons_completees'
  | 'quiz_reussis'
  | 'streak_jours'
  | 'formations_terminees'
  | 'niveau_atteint'
  | 'xp_total'

// Utilitaire : construit Insert/Update à partir d'une Row sans avoir à tout
// répéter à la main pour chaque table.
// Le champ `Relationships` est requis par le type interne `GenericTable` de
// supabase-js/postgrest-js (Row/Insert/Update/Relationships) : sans lui,
// nos définitions de table ne correspondent pas à ce type attendu et
// TypeScript retombe silencieusement sur `never` pour Update/Insert —
// exactement l'erreur de build rencontrée, malgré des Row/Update qui
// semblaient corrects en apparence.
type TableDef<
  Row,
  RequiredInsertKeys extends keyof Row,
  Rel extends readonly unknown[] = [],
> = {
  Row: Row
  Insert: Partial<Row> & Pick<Row, RequiredInsertKeys>
  Update: Partial<Row>
  Relationships: Rel
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<
        {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role: UserRole
          xp: number
          level: number
          streak_count: number
          credit_centimes: number
          last_active_at: string | null
          created_at: string
          updated_at: string
        },
        'id' | 'username'
      >

      categories: TableDef<
        {
          id: string
          slug: string
          nom: string
          description: string | null
          position: number
          created_at: string
        },
        'slug' | 'nom'
      >

      formations: TableDef<
        {
          id: string
          category_id: string | null
          slug: string
          titre: string
          description: string | null
          image_url: string | null
          is_premium: boolean
          prix_centimes: number | null
          is_published: boolean
          stripe_product_id: string | null
          stripe_price_id: string | null
          tva_taux: number
          created_at: string
          updated_at: string
        },
        'slug' | 'titre'
      >

      modules: TableDef<
        { id: string; formation_id: string; titre: string; position: number; created_at: string },
        'formation_id' | 'titre'
      >

      chapitres: TableDef<
        { id: string; module_id: string; titre: string; position: number; created_at: string },
        'module_id' | 'titre',
        [
          {
            foreignKeyName: 'chapitres_module_id_fkey'
            columns: ['module_id']
            isOneToOne: false
            referencedRelation: 'modules'
            referencedColumns: ['id']
          },
        ]
      >

      lecons: TableDef<
        {
          id: string
          chapitre_id: string
          titre: string
          type: LeconType
          duree_minutes: number | null
          position: number
          is_free_preview: boolean
          created_at: string
        },
        'chapitre_id' | 'titre',
        [
          {
            foreignKeyName: 'lecons_chapitre_id_fkey'
            columns: ['chapitre_id']
            isOneToOne: false
            referencedRelation: 'chapitres'
            referencedColumns: ['id']
          },
        ]
      >

      lecon_contents: TableDef<
        {
          lecon_id: string
          video_url: string | null
          contenu_texte: string | null
          ressources: unknown
          vdoCipher_id: string | null
        },
        'lecon_id'
      >

      enrollments: TableDef<
        {
          id: string
          user_id: string
          formation_id: string
          source: EnrollmentSource
          enrolled_at: string
        },
        'user_id' | 'formation_id'
      >

      lesson_progress: TableDef<
        { user_id: string; lecon_id: string; completed_at: string; score: number | null },
        'user_id' | 'lecon_id'
      >

      quizzes: TableDef<
        {
          id: string
          lecon_id: string
          titre: string
          description: string | null
          temps_limite_secondes: number | null
          tentatives_max: number | null
          note_passage_pourcentage: number
          created_at: string
        },
        'lecon_id' | 'titre'
      >

      questions: TableDef<
        {
          id: string
          quiz_id: string
          type: QuestionType
          enonce: string
          explication: string | null
          image_url: string | null
          reponse_attendue: string[] | null
          points: number
          position: number
          created_at: string
        },
        'quiz_id' | 'type' | 'enonce'
      >

      question_options: TableDef<
        {
          id: string
          question_id: string
          contenu: string | null
          image_url: string | null
          is_correct: boolean
          position_correcte: number | null
          position: number
          created_at: string
        },
        'question_id',
        [
          {
            foreignKeyName: 'question_options_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
        ]
      >

      question_pairs: TableDef<
        { id: string; question_id: string; gauche: string; droite: string },
        'question_id' | 'gauche' | 'droite',
        [
          {
            foreignKeyName: 'question_pairs_question_id_fkey'
            columns: ['question_id']
            isOneToOne: false
            referencedRelation: 'questions'
            referencedColumns: ['id']
          },
        ]
      >

      quiz_attempts: TableDef<
        {
          id: string
          user_id: string
          quiz_id: string
          attempt_number: number
          started_at: string
          completed_at: string | null
          duree_secondes: number | null
          score_pourcentage: number | null
          reussi: boolean | null
        },
        'user_id' | 'quiz_id' | 'attempt_number'
      >

      quiz_attempt_answers: TableDef<
        {
          attempt_id: string
          question_id: string
          reponse: unknown
          is_correct: boolean | null
          points_obtenus: number
        },
        'attempt_id' | 'question_id' | 'reponse'
      >

      orders: TableDef<
        {
          id: string
          user_id: string | null
          formation_id: string | null
          type: OrderType
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          montant_centimes: number
          tva_centimes: number
          devise: string
          code_promo: string | null
          statut: OrderStatut
          created_at: string
        },
        'type' | 'montant_centimes'
      >

      subscriptions: TableDef<
        {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          plan: string
          statut: SubscriptionStatut
          current_period_end: string | null
          created_at: string
        },
        'user_id' | 'stripe_subscription_id' | 'stripe_customer_id' | 'plan'
      >

      gift_cards: TableDef<
        {
          id: string
          code: string
          formation_id: string | null
          montant_centimes: number | null
          purchased_by: string | null
          redeemed_by: string | null
          redeemed_at: string | null
          expires_at: string | null
          created_at: string
        },
        'code'
      >

      xp_ledger: TableDef<
        {
          id: string
          user_id: string
          montant: number
          raison: string
          reference_type: string | null
          reference_id: string | null
          created_at: string
        },
        'user_id' | 'montant' | 'raison'
      >

      badges: TableDef<
        {
          id: string
          code: string
          nom: string
          description: string | null
          icone_url: string | null
          condition_type: BadgeConditionType
          seuil: number
          created_at: string
        },
        'code' | 'nom' | 'condition_type' | 'seuil'
      >

      user_badges: TableDef<
        { user_id: string; badge_id: string; obtenu_at: string },
        'user_id' | 'badge_id'
      >
    }

    Views: Record<string, never>

    Functions: {
      is_admin: { Args: { user_id: string }; Returns: boolean }
      has_formation_access: {
        Args: { p_formation_id: string; p_user_id: string | null }
        Returns: boolean
      }
      is_lesson_unlocked: {
        Args: { p_lecon_id: string; p_user_id: string | null }
        Returns: boolean
      }
      complete_lesson: {
        Args: { p_lecon_id: string; p_score?: number | null }
        Returns: { xp_gagne: number; xp_total: number; niveau: number; level_up: boolean }[]
      }
      submit_quiz_attempt: {
        Args: { p_quiz_id: string; p_reponses: unknown; p_duree_secondes?: number | null }
        Returns: {
          attempt_id: string
          score_pourcentage: number
          reussi: boolean
          attempt_number: number
          details: unknown
        }[]
      }
      redeem_gift_card: {
        Args: { p_code: string }
        Returns: { type: string; formation_slug: string | null; credit_ajoute: number }[]
      }
      debiter_credit: { Args: { p_montant_centimes: number }; Returns: void }
      enregistrer_connexion_quotidienne: {
        Args: Record<string, never>
        Returns: { streak: number; xp_gagne: number }[]
      }
    }

    Enums: {
      user_role: UserRole
      lecon_type: LeconType
      enrollment_source: EnrollmentSource
      question_type: QuestionType
      order_type: OrderType
      order_statut: OrderStatut
      subscription_statut: SubscriptionStatut
      badge_condition_type: BadgeConditionType
    }

    CompositeTypes: Record<string, never>
  }
}

// ── Prochaine étape ──────────────────────────────────────────────────────
// Ce fichier a été maintenu à la main en parallèle des migrations, ce qui
// est fragile (c'est exactement l'écart qui a causé l'erreur de build).
// Dès que le projet Supabase est lié :
//
//   npx supabase link --project-ref <ton-project-ref>
//   npx supabase db push
//   npx supabase gen types typescript --project-id <id> > types/database.types.ts
//
// et idéalement ajouter cette dernière commande comme étape de CI (avant le
// build) pour que ce fichier ne puisse plus jamais désynchroniser du schéma réel.
