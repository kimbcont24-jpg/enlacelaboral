export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      aplicaciones: {
        Row: { contacto: string; created_at: string; id: string; mensaje: string | null; nombre: string; vacante_id: string; enviada_at: string | null };
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
      pedidos_servicios: {
        Row: { id: string; codigo: string; paquete: string; precio: number; nombre: string; contacto: string; correo: string | null; puesto: string | null; cv_texto: string | null; notas: string | null; estado: string; avisado_at: string | null; pagado_at: string | null; entregado_at: string | null; created_at: string };
        Insert: { [k: string]: unknown };
        Update: { [k: string]: unknown };
        Relationships: [];
      };
      hojas_vacantes: {
        Row: { id: string; nombre: string; url: string; activa: boolean; ultima_sync: string | null; resultado: string | null; created_at: string };
        Insert: { nombre: string; url: string; activa?: boolean };
        Update: { [k: string]: unknown };
        Relationships: [];
      };
      reportes: {
        Row: { id: string; vacante_id: string; motivo: string; detalle: string | null; estado: string; created_at: string };
        Insert: { [k: string]: unknown };
        Update: { [k: string]: unknown };
        Relationships: [];
      };
      registro_actividad: {
        Row: { id: number; at: string; usuario: string | null; tabla: string; accion: string; detalle: Record<string, unknown> | null };
        Insert: { [k: string]: unknown };
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
    Functions: {
      suscribir_alerta: { Args: { p_email: string; p_area?: string | null; p_provincia?: string | null }; Returns: string };
      crear_pedido: { Args: { p_paquete: string; p_nombre: string; p_contacto: string; p_correo: string | null; p_puesto: string | null; p_cv: string | null; p_notas: string | null }; Returns: { codigo: string; precio: number } };
      importar_vacantes_admin: { Args: { p_filas: unknown }; Returns: { creadas: number; actualizadas: number; cerradas: number; omitidas: { fila: number; motivo: string }[] } };
      renovar_vacante: { Args: { p_renov: string; p_cerrar?: boolean }; Returns: { accion: "renovada" | "cerrada" | "vencida"; titulo?: string } };
      panel_admin: { Args: Record<string, never>; Returns: unknown };
      usuarios_admin: { Args: Record<string, never>; Returns: { id: string; email: string; nombre: string | null; creado: string; ultimo_acceso: string | null; es_admin: boolean }[] };
      alertas_admin: { Args: Record<string, never>; Returns: { email: string; area: string | null; provincia: string | null; activa: boolean; created_at: string; ultimo_envio: string | null }[] };
      cambiar_admin: { Args: { p_user: string; p_admin: boolean }; Returns: undefined };
      reportar_vacante: { Args: { p_id: string; p_motivo: string; p_detalle?: string | null }; Returns: undefined };
      baja_alerta: { Args: { p_token: string }; Returns: string };
    };
    Enums: { app_role: "admin" | "user" };
    CompositeTypes: { [_ in never]: never };
  };
};
