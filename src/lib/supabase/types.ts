export type AppRole = "donor" | "org_admin" | "org_member" | "community_manager";
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["campaigns"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [];
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
        Relationships: [];
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
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["donations"]["Row"], "id" | "created_at">;
        Update: never; // append-only
        Relationships: [];
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
        Update: Pick<Database["public"]["Tables"]["recurring_donations"]["Row"], "status" | "next_charge_date">;
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
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
