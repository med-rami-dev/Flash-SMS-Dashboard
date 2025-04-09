
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      countries: {
        Row: {
          id: number
          name: string
          iso_code: string
          price: number
          created_at?: string
        }
        Insert: {
          id?: number
          name: string
          iso_code: string
          price: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          iso_code?: string
          price?: number
          created_at?: string
        }
      }
      services: {
        Row: {
          id: number
          name: string
          price: number
          description?: string
          created_at?: string
        }
        Insert: {
          id?: number
          name: string
          price: number
          description?: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          price?: number
          description?: string
          created_at?: string
        }
      }
      offers_news: {
        Row: {
          id: number
          title: string
          content: string
          publication_date: string
          image_url?: string
          created_at?: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          publication_date: string
          image_url?: string
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          publication_date?: string
          image_url?: string
          created_at?: string
        }
      }
    }
  }
}
