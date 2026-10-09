export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      aplicaciones: {
        Row: { contacto: string; created_at: string; id: string; mensaje: string | null; nombre: string; vacante_id: string };
        Insert: { contacto: string; created_at?: string; id?: string; mensaje?: string | null; nombre: string; vacante_id: string };
        Update: { [k: string]: unknown };
        Relationships: [{ foreignKeyName: "aplicaciones_vacante_id_fkey"; columns: ["vacante_id"]; isOneToOne: false; referencedRelation: "vacantes"; referencedColumns: ["id"] }];
      };
      borradores: {
        Row: { id: string; created_at: string; origen: string; estado: string; texto: string; titulo: string | null; empresa: string | null; provincia: string | null; contacto_nombre: string | null; contacto_email: string | null; contacto_telefono: string | null; fuente: string | null; fuente_url: string | null; datos: Record<string, unknown> | null };
        Insert: { texto: string; [k: string]: unknown };
        Update: { [k: string]: unknown };
        Relationships: [];
      };
      contenido_sitio: {
        Row: { clave: string; updated_at: string; valor: string };
        Insert: { clave: string; updated_at?: string; valor?: string };
        Update: { clave?: string; updated_at?: string; valor?: string };
        Relationships: [];
      };
      empresas: {
        Row: { contacto_email: string | null; contacto_nombre: string | null; contacto_telefono: string | null; created_at: string; id: string; nombre: string; owner_id: string; provincia: string | null; rnc: string; sector: string | null; verificada: boolean };
        Insert: { owner_id: string; nombre: string; rnc: string; [k: string]: unknown };
        Update: { [k: string]: unknown };
        Relationships: [];
      };
      user_roles: {
        Row: { id: string; role: "admin" | "user"; user_id: string };
        Insert: { id?: string; role: "admin" | "user"; user_id: string };
        Update: { [k: string]: unknown };
        Relationships: [];
      };
      vacantes: {
        Row: { area: string; beneficios: string[]; created_at: string; descripcion: string; destacada: boolean; empresa_id: string; estado: string; etiquetas: string[]; experiencia: string; id: string; modalidad: string; owner_id: string; provincia: string; requisitos: string[]; salario_max: number | null; salario_min: number; tipo: string; titulo: string };
        Insert: { empresa_id: string; owner_id: string; titulo: string; [k: string]: unknown };
        Update: { [k: string]: unknown };
        Relationships: [{ foreignKeyName: "vacantes_empresa_id_fkey"; columns: ["empresa_id"]; isOneToOne: false; referencedRelation: "empresas"; referencedColumns: ["id"] }];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { app_role: "admin" | "user" };
    CompositeTypes: { [_ in never]: never };
  };
};
