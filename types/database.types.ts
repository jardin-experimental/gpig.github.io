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
      atomes_ledger: {
        Row: {
          created_at: string
          id: string
          montant: number
          raison: string
          reference_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          montant: number
          raison: string
          reference_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          montant?: number
          raison?: string
          reference_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atomes_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      boutique_commande_items: {
        Row: {
          id: string
          order_id: string
          prix_unitaire_atomes: number | null
          prix_unitaire_centimes: number | null
          produit_id: string
          quantite: number
        }
        Insert: {
          id?: string
          order_id: string
          prix_unitaire_atomes?: number | null
          prix_unitaire_centimes?: number | null
          produit_id: string
          quantite: number
        }
        Update: {
          id?: string
          order_id?: string
          prix_unitaire_atomes?: number | null
          prix_unitaire_centimes?: number | null
          produit_id?: string
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "boutique_commande_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boutique_commande_items_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
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
      chasses_ar: {
        Row: {
          created_at: string
          formation_id: string | null
          id: string
          is_active: boolean
          label: string
          latitude: number
          longitude: number
          rayon_metres: number
          slug: string
          tolerance_angle: number
          url_destination: string
        }
        Insert: {
          created_at?: string
          formation_id?: string | null
          id?: string
          is_active?: boolean
          label: string
          latitude: number
          longitude: number
          rayon_metres?: number
          slug: string
          tolerance_angle?: number
          url_destination: string
        }
        Update: {
          created_at?: string
          formation_id?: string | null
          id?: string
          is_active?: boolean
          label?: string
          latitude?: number
          longitude?: number
          rayon_metres?: number
          slug?: string
          tolerance_angle?: number
          url_destination?: string
        }
        Relationships: [
          {
            foreignKeyName: "chasses_ar_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_credits_ledger: {
        Row: {
          created_at: string
          heures: number
          id: string
          raison: string
          reference_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          heures: number
          id?: string
          raison: string
          reference_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          heures?: number
          id?: string
          raison?: string
          reference_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_credits_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_slots: {
        Row: {
          created_at: string
          end_at: string
          hold_expires_at: string | null
          id: string
          source: string | null
          start_at: string
          statut: Database["public"]["Enums"]["consultation_statut"]
          stripe_session_id: string | null
          user_id: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_start_url: string | null
        }
        Insert: {
          created_at?: string
          end_at: string
          hold_expires_at?: string | null
          id?: string
          source?: string | null
          start_at: string
          statut?: Database["public"]["Enums"]["consultation_statut"]
          stripe_session_id?: string | null
          user_id?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_start_url?: string | null
        }
        Update: {
          created_at?: string
          end_at?: string
          hold_expires_at?: string | null
          id?: string
          source?: string | null
          start_at?: string
          statut?: Database["public"]["Enums"]["consultation_statut"]
          stripe_session_id?: string | null
          user_id?: string | null
          zoom_join_url?: string | null
          zoom_meeting_id?: string | null
          zoom_start_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_slots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      h5p_attempts: {
        Row: {
          content_id: string
          created_at: string
          id: string
          lesson_id: string
          max_score: number | null
          raw_score: number | null
          score: number
          user_id: string
          verb: string | null
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          lesson_id: string
          max_score?: number | null
          raw_score?: number | null
          score: number
          user_id: string
          verb?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          max_score?: number | null
          raw_score?: number | null
          score?: number
          user_id?: string
          verb?: string | null
        }
        Relationships: []
      }
      lecon_contents: {
        Row: {
          contenu_texte: string | null
          h5p_content_id: string | null
          lecon_id: string
          ressources: Json | null
          vdoCipher_id: string | null
          video_url: string | null
        }
        Insert: {
          contenu_texte?: string | null
          h5p_content_id?: string | null
          lecon_id: string
          ressources?: Json | null
          vdoCipher_id?: string | null
          video_url?: string | null
        }
        Update: {
          contenu_texte?: string | null
          h5p_content_id?: string | null
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
          adresse_livraison: Json | null
          code_promo: string | null
          created_at: string
          devise: string
          formation_id: string | null
          gelato_order_id: string | null
          gelato_statut: string | null
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
          adresse_livraison?: Json | null
          code_promo?: string | null
          created_at?: string
          devise?: string
          formation_id?: string | null
          gelato_order_id?: string | null
          gelato_statut?: string | null
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
          adresse_livraison?: Json | null
          code_promo?: string | null
          created_at?: string
          devise?: string
          formation_id?: string | null
          gelato_order_id?: string | null
          gelato_statut?: string | null
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
      panier_items: {
        Row: {
          created_at: string
          id: string
          produit_id: string
          quantite: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          produit_id: string
          quantite?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          produit_id?: string
          quantite?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "panier_items_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "panier_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          categorie: string
          created_at: string
          description: string | null
          disponible: boolean
          gelato_print_file_url: string | null
          gelato_product_uid: string | null
          id: string
          image_url: string | null
          images_url: string[] | null
          nom: string
          pod_provider: string | null
          pod_variant_id: string | null
          prix_atomes: number | null
          prix_centimes: number | null
          slug: string
          type: Database["public"]["Enums"]["produit_type"]
        }
        Insert: {
          categorie: string
          created_at?: string
          description?: string | null
          disponible?: boolean
          gelato_print_file_url?: string | null
          gelato_product_uid?: string | null
          id?: string
          image_url?: string | null
          images_url?: string[] | null
          nom: string
          pod_provider?: string | null
          pod_variant_id?: string | null
          prix_atomes?: number | null
          prix_centimes?: number | null
          slug: string
          type: Database["public"]["Enums"]["produit_type"]
        }
        Update: {
          categorie?: string
          created_at?: string
          description?: string | null
          disponible?: boolean
          gelato_print_file_url?: string | null
          gelato_product_uid?: string | null
          id?: string
          image_url?: string | null
          images_url?: string[] | null
          nom?: string
          pod_provider?: string | null
          pod_variant_id?: string | null
          prix_atomes?: number | null
          prix_centimes?: number | null
          slug?: string
          type?: Database["public"]["Enums"]["produit_type"]
        }
        Relationships: []
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
      video_interaction_completions: {
        Row: {
          completed_at: string
          interaction_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          interaction_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          interaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_interaction_completions_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "video_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      video_interactions: {
        Row: {
          contenu: string | null
          created_at: string
          id: string
          image_url: string | null
          lecon_id: string
          pause_video: boolean
          quiz_id: string | null
          timestamp_seconds: number
          titre: string | null
          type: string
        }
        Insert: {
          contenu?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          lecon_id: string
          pause_video?: boolean
          quiz_id?: string | null
          timestamp_seconds: number
          titre?: string | null
          type: string
        }
        Update: {
          contenu?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          lecon_id?: string
          pause_video?: boolean
          quiz_id?: string | null
          timestamp_seconds?: number
          titre?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_interactions_lecon_id_fkey"
            columns: ["lecon_id"]
            isOneToOne: false
            referencedRelation: "lecons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_interactions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
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
      acheter_panier_atomes: {
        Args: { p_adresse?: Json }
        Returns: {
          adresse_livraison: Json | null
          code_promo: string | null
          created_at: string
          devise: string
          formation_id: string | null
          gelato_order_id: string | null
          gelato_statut: string | null
          id: string
          montant_centimes: number
          statut: Database["public"]["Enums"]["order_statut"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tva_centimes: number
          type: Database["public"]["Enums"]["order_type"]
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_create_video_interaction: {
        Args: {
          p_contenu?: string
          p_image_url?: string
          p_lecon_id: string
          p_pause_video?: boolean
          p_quiz_id?: string
          p_timestamp_seconds: number
          p_titre?: string
          p_type: string
        }
        Returns: string
      }
      admin_delete_video_interaction: {
        Args: { p_id: string }
        Returns: undefined
      }
      admin_list_video_interactions: {
        Args: { p_lecon_id: string }
        Returns: {
          contenu: string | null
          created_at: string
          id: string
          image_url: string | null
          lecon_id: string
          pause_video: boolean
          quiz_id: string | null
          timestamp_seconds: number
          titre: string | null
          type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "video_interactions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_update_video_interaction: {
        Args: {
          p_contenu?: string
          p_id: string
          p_image_url?: string
          p_pause_video?: boolean
          p_quiz_id?: string
          p_timestamp_seconds: number
          p_titre?: string
          p_type: string
        }
        Returns: undefined
      }
      ajouter_au_panier: {
        Args: { p_produit_id: string; p_quantite?: number }
        Returns: {
          created_at: string
          id: string
          produit_id: string
          quantite: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "panier_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      book_consultation_slot_with_credit: {
        Args: { p_slot_id: string }
        Returns: {
          created_at: string
          end_at: string
          hold_expires_at: string | null
          id: string
          source: string | null
          start_at: string
          statut: Database["public"]["Enums"]["consultation_statut"]
          stripe_session_id: string | null
          user_id: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_start_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "consultation_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_consultation_slot: {
        Args: { p_slot_id: string }
        Returns: {
          created_at: string
          end_at: string
          hold_expires_at: string | null
          id: string
          source: string | null
          start_at: string
          statut: Database["public"]["Enums"]["consultation_statut"]
          stripe_session_id: string | null
          user_id: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_start_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "consultation_slots"
          isOneToOne: true
          isSetofReturn: false
        }
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
      hold_consultation_slot: {
        Args: { p_slot_id: string }
        Returns: {
          created_at: string
          end_at: string
          hold_expires_at: string | null
          id: string
          source: string | null
          start_at: string
          statut: Database["public"]["Enums"]["consultation_statut"]
          stripe_session_id: string | null
          user_id: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_start_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "consultation_slots"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_lesson_unlocked: {
        Args: { p_lecon_id: string; p_user_id: string }
        Returns: boolean
      }
      mes_atomes_disponibles: { Args: never; Returns: number }
      mes_heures_consultation_disponibles: { Args: never; Returns: number }
      modifier_quantite_panier: {
        Args: { p_produit_id: string; p_quantite: number }
        Returns: {
          created_at: string
          id: string
          produit_id: string
          quantite: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "panier_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      preparer_commande_panier_physique: {
        Args: never
        Returns: {
          adresse_livraison: Json | null
          code_promo: string | null
          created_at: string
          devise: string
          formation_id: string | null
          gelato_order_id: string | null
          gelato_statut: string | null
          id: string
          montant_centimes: number
          statut: Database["public"]["Enums"]["order_statut"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tva_centimes: number
          type: Database["public"]["Enums"]["order_type"]
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_gift_card: {
        Args: { p_code: string }
        Returns: {
          credit_ajoute: number
          formation_slug: string
          type: string
        }[]
      }
      set_consultation_slot_zoom: {
        Args: {
          p_slot_id: string
          p_zoom_join_url: string
          p_zoom_meeting_id: string
          p_zoom_start_url: string
        }
        Returns: {
          created_at: string
          end_at: string
          hold_expires_at: string | null
          id: string
          source: string | null
          start_at: string
          statut: Database["public"]["Enums"]["consultation_statut"]
          stripe_session_id: string | null
          user_id: string | null
          zoom_join_url: string | null
          zoom_meeting_id: string | null
          zoom_start_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "consultation_slots"
          isOneToOne: true
          isSetofReturn: false
        }
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
      vider_panier: { Args: never; Returns: undefined }
    }
    Enums: {
      badge_condition_type:
        | "lecons_completees"
        | "quiz_reussis"
        | "streak_jours"
        | "formations_terminees"
        | "niveau_atteint"
        | "xp_total"
      consultation_statut:
        | "libre"
        | "en_attente_paiement"
        | "reservee"
        | "annulee"
      enrollment_source: "achat" | "offert" | "abonnement"
      lecon_type: "video" | "exercice" | "quiz" | "telechargement" | "texte"
      order_statut: "en_attente" | "paye" | "rembourse" | "echoue"
      order_type:
        | "formation"
        | "abonnement"
        | "pack"
        | "bon_cadeau"
        | "consultation_heure"
        | "consultation_pack10h"
        | "pack_atomes"
        | "boutique"
      produit_type: "numerique" | "physique"
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
      consultation_statut: [
        "libre",
        "en_attente_paiement",
        "reservee",
        "annulee",
      ],
      enrollment_source: ["achat", "offert", "abonnement"],
      lecon_type: ["video", "exercice", "quiz", "telechargement", "texte"],
      order_statut: ["en_attente", "paye", "rembourse", "echoue"],
      order_type: [
        "formation",
        "abonnement",
        "pack",
        "bon_cadeau",
        "consultation_heure",
        "consultation_pack10h",
        "pack_atomes",
        "boutique",
      ],
      produit_type: ["numerique", "physique"],
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
