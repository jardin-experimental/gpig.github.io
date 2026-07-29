export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          code: string
          condition_type: Database["public"]["Enums"]["badge_condition_type"]
          created_at: string
          description: string | null
          icone_url: string | null
          id: string
          nom: string
          seuil: number
        }
        Insert: {
          code: string
          condition_type: Database["public"]["Enums"]["badge_condition_type"]
          created_at?: string
          description?: string | null
          icone_url?: string | null
          id?: string
          nom: string
          seuil: number
        }
        Update: {
          code?: string
          condition_type?: Database["public"]["Enums"]["badge_condition_type"]
          created_at?: string
          description?: string | null
          icone_url?: string | null
          id?: string
          nom?: string
          seuil?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          position: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          position?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          position?: number
          slug?: string
        }
        Relationships: []
      }
      chapitres: {
        Row: {
          created_at: string
          id: string
          module_id: string
          position: number
          titre: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          position?: number
          titre: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          position?: number
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapitres_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          enrolled_at: string
          formation_id: string
          id: string
          source: Database["public"]["Enums"]["enrollment_source"]
          user_id: string
        }
        Insert: {
          enrolled_at?: string
          formation_id: string
          id?: string
          source?: Database["public"]["Enums"]["enrollment_source"]
          user_id: string
        }
        Update: {
          enrolled_at?: string
          formation_id?: string
          id?: string
          source?: Database["public"]["Enums"]["enrollment_source"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      formations: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_premium: boolean
          is_published: boolean
          prix_centimes: number | null
          slug: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          titre: string
          tva_taux: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean
          is_published?: boolean
          prix_centimes?: number | null
          slug: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          titre: string
          tva_taux?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean
          is_published?: boolean
          prix_centimes?: number | null
          slug?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          titre?: string
          tva_taux?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          formation_id: string | null
          id: string
          montant_centimes: number | null
          purchased_by: string | null
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          formation_id?: string | null
          id?: string
          montant_centimes?: number | null
          purchased_by?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          formation_id?: string | null
          id?: string
          montant_centimes?: number | null
          purchased_by?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lecon_contents: {
        Row: {
          contenu_texte: string | null
          lecon_id: string
          ressources: Json | null
          vdoCipher_id: string | null
          video_url: string | null
        }
        Insert: {
          contenu_texte?: string | null
          lecon_id: string
          ressources?: Json | null
          vdoCipher_id?: string | null
          video_url?: string | null
        }
        Update: {
          contenu_texte?: string | null
          lecon_id?: string
          ressources?: Json | null
          vdoCipher_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecon_contents_lecon_id_fkey"
            columns: ["lecon_id"]
            isOneToOne: true
            referencedRelation: "lecons"
            referencedColumns: ["id"]
          },
        ]
      }
      lecons: {
        Row: {
          chapitre_id: string
          created_at: string
          duree_minutes: number | null
          id: string
          is_free_preview: boolean
          position: number
          titre: string
          type: Database["public"]["Enums"]["lecon_type"]
        }
        Insert: {
          chapitre_id: string
          created_at?: string
          duree_minutes?: number | null
          id?: string
          is_free_preview?: boolean
          position?: number
          titre: string
          type?: Database["public"]["Enums"]["lecon_type"]
        }
        Update: {
          chapitre_id?: string
          created_at?: string
          duree_minutes?: number | null
          id?: string
          is_free_preview?: boolean
          position?: number
          titre?: string
          type?: Database["public"]["Enums"]["lecon_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lecons_chapitre_id_fkey"
            columns: ["chapitre_id"]
            isOneToOne: false
            referencedRelation: "chapitres"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          lecon_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          lecon_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string
          lecon_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lecon_id_fkey"
            columns: ["lecon_id"]
            isOneToOne: false
            referencedRelation: "lecons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          formation_id: string
          id: string
          position: number
          titre: string
        }
        Insert: {
          created_at?: string
          formation_id: string
          id?: string
          position?: number
          titre: string
        }
        Update: {
          created_at?: string
          formation_id?: string
          id?: string
          position?: number
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          code_promo: string | null
          created_at: string
          devise: string
          formation_id: string | null
          id: string
          montant_centimes: number
          statut: Database["public"]["Enums"]["order_statut"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tva_centimes: number
          type: Database["public"]["Enums"]["order_type"]
          user_id: string | null
        }
        Insert: {
          code_promo?: string | null
          created_at?: string
          devise?: string
          formation_id?: string | null
          id?: string
          montant_centimes: number
          statut?: Database["public"]["Enums"]["order_statut"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tva_centimes?: number
          type: Database["public"]["Enums"]["order_type"]
          user_id?: string | null
        }
        Update: {
          code_promo?: string | null
          created_at?: string
          devise?: string
          formation_id?: string | null
          id?: string
          montant_centimes?: number
          statut?: Database["public"]["Enums"]["order_statut"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tva_centimes?: number
          type?: Database["public"]["Enums"]["order_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          credit_centimes: number
          display_name: string | null
          id: string
          last_active_at: string | null
          level: number
          role: Database["public"]["Enums"]["user_role"]
          streak_count: number
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credit_centimes?: number
          display_name?: string | null
          id: string
          last_active_at?: string | null
          level?: number
          role?: Database["public"]["Enums"]["user_role"]
          streak_count?: number
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          credit_centimes?: number
          display_name?: string | null
          id?: string
          last_active_at?: string | null
          level?: number
          role?: Database["public"]["Enums"]["user_role"]
          streak_count?: number
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      question_options: {
        Row: {
          contenu: string | null
          created_at: string
          id: string
          image_url: string | null
          is_correct: boolean
          position: number
          position_correcte: number | null
          question_id: string
        }
        Insert: {
          contenu?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_correct?: boolean
          position?: number
          position_correcte?: number | null
          question_id: string
        }
        Update: {
          contenu?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_correct?: boolean
          position?: number
          position_correcte?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_pairs: {
        Row: {
          droite: string
          gauche: string
          id: string
          question_id: string
        }
        Insert: {
          droite: string
          gauche: string
          id?: string
          question_id: string
        }
        Update: {
          droite?: string
          gauche?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_pairs_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          enonce: string
          explication: string | null
          id: string
          image_url: string | null
          points: number
          position: number
          quiz_id: string
          reponse_attendue: string[] | null
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          created_at?: string
          enonce: string
          explication?: string | null
          id?: string
          image_url?: string | null
          points?: number
          position?: number
          quiz_id: string
          reponse_attendue?: string[] | null
          type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          created_at?: string
          enonce?: string
          explication?: string | null
          id?: string
          image_url?: string | null
          points?: number
          position?: number
          quiz_id?: string
          reponse_attendue?: string[] | null
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          attempt_id: string
          is_correct: boolean | null
          points_obtenus: number
          question_id: string
          reponse: Json
        }
        Insert: {
          attempt_id: string
          is_correct?: boolean | null
          points_obtenus?: number
          question_id: string
          reponse: Json
        }
        Update: {
          attempt_id?: string
          is_correct?: boolean | null
          points_obtenus?: number
          question_id?: string
          reponse?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          completed_at: string | null
          duree_secondes: number | null
          id: string
          quiz_id: string
          reussi: boolean | null
          score_pourcentage: number | null
          started_at: string
          user_id: string
        }
        Insert: {
          attempt_number: number
          completed_at?: string | null
          duree_secondes?: number | null
          id?: string
          quiz_id: string
          reussi?: boolean | null
          score_pourcentage?: number | null
          started_at?: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          duree_secondes?: number | null
          id?: string
          quiz_id?: string
          reussi?: boolean | null
          score_pourcentage?: number | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lecon_id: string
          note_passage_pourcentage: number
          temps_limite_secondes: number | null
          tentatives_max: number | null
          titre: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lecon_id: string
          note_passage_pourcentage?: number
          temps_limite_secondes?: number | null
          tentatives_max?: number | null
          titre: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lecon_id?: string
          note_passage_pourcentage?: number
          temps_limite_secondes?: number | null
          tentatives_max?: number | null
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lecon_id_fkey"
            columns: ["lecon_id"]
            isOneToOne: true
            referencedRelation: "lecons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          statut: Database["public"]["Enums"]["subscription_statut"]
          stripe_customer_id: string
          stripe_subscription_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan: string
          statut?: Database["public"]["Enums"]["subscription_statut"]
          stripe_customer_id: string
          stripe_subscription_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          statut?: Database["public"]["Enums"]["subscription_statut"]
          stripe_customer_id?: string
          stripe_subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          obtenu_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          obtenu_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          obtenu_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_ledger: {
        Row: {
          created_at: string
          id: string
          montant: number
          raison: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          montant: number
          raison: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          montant?: number
          raison?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          p_montant: number
          p_raison: string
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: {
          level_up: boolean
          niveau: number
          xp_total: number
        }[]
      }
      check_and_award_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      complete_lesson: {
        Args: { p_lecon_id: string; p_score?: number }
        Returns: {
          level_up: boolean
          niveau: number
          xp_gagne: number
          xp_total: number
        }[]
      }
      debiter_credit: {
        Args: { p_montant_centimes: number }
        Returns: undefined
      }
      enregistrer_connexion_quotidienne: {
        Args: never
        Returns: {
          streak: number
          xp_gagne: number
        }[]
      }
      has_formation_access: {
        Args: { p_formation_id: string; p_user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_lesson_unlocked: {
        Args: { p_lecon_id: string; p_user_id: string }
        Returns: boolean
      }
      redeem_gift_card: {
        Args: { p_code: string }
        Returns: {
          credit_ajoute: number
          formation_slug: string
          type: string
        }[]
      }
      submit_quiz_attempt: {
        Args: { p_duree_secondes?: number; p_quiz_id: string; p_reponses: Json }
        Returns: {
          attempt_id: string
          attempt_number: number
          details: Json
          reussi: boolean
          score_pourcentage: number
        }[]
      }
    }
    Enums: {
      badge_condition_type:
        | "lecons_completees"
        | "quiz_reussis"
        | "streak_jours"
        | "formations_terminees"
        | "niveau_atteint"
        | "xp_total"
      enrollment_source: "achat" | "offert" | "abonnement"
      lecon_type: "video" | "exercice" | "quiz" | "telechargement" | "texte"
      order_statut: "en_attente" | "paye" | "rembourse" | "echoue"
      order_type: "formation" | "abonnement" | "pack" | "bon_cadeau"
      question_type:
        | "qcm"
        | "choix_multiple"
        | "vrai_faux"
        | "texte_libre"
        | "association"
        | "ordonnancement"
        | "image"
        | "code"
      subscription_statut: "active" | "en_pause" | "annulee" | "impayee"
      user_role:
        | "visiteur"
        | "membre"
        | "etudiant"
        | "client"
        | "coach"
        | "administrateur"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      badge_condition_type: [
        "lecons_completees",
        "quiz_reussis",
        "streak_jours",
        "formations_terminees",
        "niveau_atteint",
        "xp_total",
      ],
      enrollment_source: ["achat", "offert", "abonnement"],
      lecon_type: ["video", "exercice", "quiz", "telechargement", "texte"],
      order_statut: ["en_attente", "paye", "rembourse", "echoue"],
      order_type: ["formation", "abonnement", "pack", "bon_cadeau"],
      question_type: [
        "qcm",
        "choix_multiple",
        "vrai_faux",
        "texte_libre",
        "association",
        "ordonnancement",
        "image",
        "code",
      ],
      subscription_statut: ["active", "en_pause", "annulee", "impayee"],
      user_role: [
        "visiteur",
        "membre",
        "etudiant",
        "client",
        "coach",
        "administrateur",
      ],
    },
  },
} as const
