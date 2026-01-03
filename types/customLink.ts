/**
 * TYPES: Custom Link Entity
 * 
 * Modello dati per custom link degli utenti
 * 
 * I custom link sono collegamenti rapidi personalizzati per ogni cliente
 * (es: link cartella drive, documenti, risorse, etc.)
 */

export interface CustomLink {
  id: string;
  label: string; // Nome del link (es: "Cartella Drive", "Documenti", "Brochure")
  url: string; // URL completo
  icon?: string; // Icona opzionale (es: nome icona react-icons)
  order?: number; // Ordine di visualizzazione
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCustomLinks {
  userId: string;
  links: CustomLink[];
  updatedAt: Date;
}

export interface CreateCustomLinkInput {
  label: string;
  url: string;
  icon?: string;
}

export interface UpdateCustomLinkInput {
  id: string;
  label?: string;
  url?: string;
  icon?: string;
}
