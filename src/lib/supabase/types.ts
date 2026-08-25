export type AppRole = "donor" | "ngo_owner" | "community_owner" | "admin";
export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived" | "blocked";
export type DonationStatus = "pending" | "completed" | "failed" | "refunded";
export type RecurringStatus = "active" | "paused" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          full_name_en: string | null;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          app_role: AppRole;
          org_id: string | null;
          community_id: string | null;
          id_number: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          initials: string | null;
          color: string;
          description: string | null;
          description_en: string | null;
          logo_url: string | null;
          registration_number: string | null;
          verified: boolean;
          bank_name: string | null;
          bank_branch: string | null;
          bank_account: string | null;
          founded: string | null;
          founded_en: string | null;
          ceo: string | null;
          ceo_en: string | null;
          volunteers: number;
          address: string | null;
          address_en: string | null;
          phone: string | null;
          video_gradient: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          title: string;
          title_en: string | null;
          short_desc: string | null;
          short_desc_en: string | null;
          story: string | null;
          story_en: string | null;
          org_id: string;
          category: string;
          goal: number;
          raised: number;
          donors_count: number;
          end_date: string | null;
          status: CampaignStatus;
          gradient: string;
          emoji: string;
          hero_image_url: string | null;
          video_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["campaigns"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [{ foreignKeyName: "campaigns_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      products: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          name_en: string | null;
          description: string | null;
          description_en: string | null;
          price: number;
          emoji: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      campaign_products: {
        Row: { campaign_id: string; product_id: string };
        Insert: Database["public"]["Tables"]["campaign_products"]["Row"];
        Update: never;
        Relationships: [
          { foreignKeyName: "campaign_products_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] },
          { foreignKeyName: "campaign_products_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      donations: {
        Row: {
          id: string;
          donor_id: string | null;
          campaign_id: string;
          org_id: string;
          amount: number;
          currency: string;
          status: DonationStatus;
          is_recurring: boolean;
          dedication_name: string | null;
          dedication_message: string | null;
          community_id: string | null;
          psp_token: string | null;
          last_four: string | null;
          card_brand: string | null;
          receipt_id: string | null;
          receipt_url: string | null;
          product_id: string | null;
          donation_type: string | null;
          quantity: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["donations"]["Row"], "id" | "created_at" | "product_id" | "donation_type" | "quantity"> & { product_id?: string | null; donation_type?: string | null; quantity?: number };
        Update: never; // append-only
        Relationships: [
          { foreignKeyName: "donations_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] },
          { foreignKeyName: "donations_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "donations_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      recurring_donations: {
        Row: {
          id: string;
          donor_id: string;
          campaign_id: string;
          org_id: string;
          amount: number;
          status: RecurringStatus;
          next_charge_date: string | null;
          start_date: string;
          psp_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["recurring_donations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Pick<Database["public"]["Tables"]["recurring_donations"]["Row"], "status" | "next_charge_date" | "updated_at">>;
        Relationships: [
          { foreignKeyName: "recurring_donations_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] },
          { foreignKeyName: "recurring_donations_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ];
      };
      communities: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          description: string | null;
          manager_id: string | null;
          org_id: string | null;
          referral_code: string | null;
          total_raised: number;
          donors_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["communities"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["communities"]["Insert"]>;
        Relationships: [{ foreignKeyName: "communities_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      payment_methods: {
        Row: { id: string; donor_id: string | null; brand: string; last_four: string; psp_token: string | null; created_at: string };
        Insert: { id?: string; donor_id?: string | null; brand: string; last_four: string; psp_token?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["payment_methods"]["Row"]>;
        Relationships: [
          { foreignKeyName: "profiles_org_id_fkey"; columns: ["org_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "profiles_community_id_fkey"; columns: ["community_id"]; isOneToOne: false; referencedRelation: "communities"; referencedColumns: ["id"] },
        ];
      };
      system_updates: {
        Row: { id: string; donor_id: string | null; org_id: string | null; title: string; title_en: string | null; detail: string | null; detail_en: string | null; status: string; action_label: string | null; action_label_en: string | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["system_updates"]["Row"]> & { title: string };
        Update: Partial<Database["public"]["Tables"]["system_updates"]["Row"]>;
        Relationships: [];
      };
      hero_cards: {
        Row: { id: string; image_url: string | null; bubble_text: string; bubble_text_en: string | null; display_order: number; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["hero_cards"]["Row"]> & { bubble_text: string };
        Update: Partial<Database["public"]["Tables"]["hero_cards"]["Row"]>;
        Relationships: [];
      };
      site_content: {
        Row: { key: string; text_he: string | null; text_en: string | null; updated_at: string };
        Insert: { key: string; text_he?: string | null; text_en?: string | null; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["site_content"]["Row"]>;
        Relationships: [];
      };
      site_datasets: {
        Row: {
          key: string;
          source_file: string;
          value: unknown;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["site_datasets"]["Row"];
        Update: Partial<Database["public"]["Tables"]["site_datasets"]["Insert"]>;
        Relationships: [];
      };
      admin_role_audit: {
        Row: {
          id: number;
          actor_id: string;
          profile_id: string;
          old_role: AppRole;
          new_role: AppRole;
          old_org_id: string | null;
          new_org_id: string | null;
          old_community_id: string | null;
          new_community_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_donor_signup: {
        Args: { p_full_name: string };
        Returns: string;
      };
      complete_ngo_signup: {
        Args: { p_full_name: string; p_org_name: string; p_org_name_en?: string | null };
        Returns: string;
      };
      complete_community_signup: {
        Args: { p_full_name: string; p_community_name: string; p_community_name_en?: string | null };
        Returns: string;
      };
      admin_update_profile_role: {
        Args: { p_profile_id: string; p_role: AppRole; p_org_id?: string | null; p_community_id?: string | null };
        Returns: undefined;
      };
      publish_campaign: {
        Args: {
          p_title: string;
          p_short_desc: string;
          p_story: string;
          p_category: string;
          p_goal: number;
          p_end_date: string | null;
          p_product_ids?: string[];
          p_hero_image_url?: string | null;
          p_video_url?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: AppRole;
      campaign_status: CampaignStatus;
      donation_status: DonationStatus;
      recurring_status: RecurringStatus;
    };
  };
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
export type RecurringDonation = Database["public"]["Tables"]["recurring_donations"]["Row"];
export type Community = Database["public"]["Tables"]["communities"]["Row"];

// Campaign with joined org (common query shape)
export type CampaignWithOrg = Campaign & { organizations: Organization };
