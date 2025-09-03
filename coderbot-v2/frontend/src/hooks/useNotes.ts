import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/integrations/pocketbase/client';

export interface Note {
  id: string;
  title: string;
  content: string;
  subject?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  isPublic: boolean;
  userId?: string;
}

export interface NoteFilters {
  subject?: string;
  tags?: string[];
  searchQuery?: string;
  showFavoritesOnly?: boolean;
  showPublicOnly?: boolean;
}

const STORAGE_KEY = 'educational-notes';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load notes from localStorage and PocketBase
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);

        // Load from localStorage first (for offline support)
        const localNotes = localStorage.getItem(STORAGE_KEY);
        if (localNotes) {
          const parsedNotes = JSON.parse(localNotes).map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          }));
          setNotes(parsedNotes);
        }

        // If user is authenticated, try to load from PocketBase
        if (pb.authStore.isValid) {
          try {
            const userId = pb.authStore.model?.id;
            const remoteNotes = await pb.collection('notes').getFullList({
              filter: `userId = "${userId}"`,
              sort: '-updatedAt',
            });

            const formattedNotes = remoteNotes.map(note => ({
              id: note.id,
              title: note.title,
              content: note.content,
              subject: note.subject,
              tags: note.tags || [],
              createdAt: new Date(note.createdAt),
              updatedAt: new Date(note.updatedAt),
              isFavorite: note.isFavorite || false,
              isPublic: note.isPublic || false,
              userId: note.userId,
            }));

            setNotes(formattedNotes);
            // Update localStorage with remote data
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedNotes));
          } catch (remoteError) {
            console.warn('Failed to load notes from server:', remoteError);
            // Keep local notes if remote fails
          }
        }
      } catch (error) {
        console.error('Error loading notes:', error);
        setError('Erro ao carregar anotações');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  // Save notes to both localStorage and PocketBase
  const saveNotesToStorage = useCallback(async (updatedNotes: Note[]) => {
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));

      // Save to PocketBase if authenticated
      if (pb.authStore.isValid) {
        const userId = pb.authStore.model?.id;
        for (const note of updatedNotes) {
          try {
            const noteData = {
              ...note,
              userId,
              createdAt: note.createdAt.toISOString(),
              updatedAt: note.updatedAt.toISOString(),
            };

            if (note.userId) {
              // Update existing note
              await pb.collection('notes').update(note.id, noteData);
            } else {
              // Create new note
              const created = await pb.collection('notes').create(noteData);
              note.id = created.id;
            }
          } catch (remoteError) {
            console.warn('Failed to sync note to server:', remoteError);
          }
        }
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('Erro ao salvar anotações');
    }
  }, []);

  const createNote = useCallback(async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes);

    return newNote;
  }, [notes, saveNotesToStorage]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    );

    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes);
  }, [notes, saveNotesToStorage]);

  const deleteNote = useCallback(async (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    await saveNotesToStorage(updatedNotes);

    // Try to delete from PocketBase
    if (pb.authStore.isValid) {
      try {
        await pb.collection('notes').delete(noteId);
      } catch (remoteError) {
        console.warn('Failed to delete note from server:', remoteError);
      }
    }
  }, [notes, saveNotesToStorage]);

  const toggleFavorite = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      await updateNote(noteId, { isFavorite: !note.isFavorite });
    }
  }, [notes, updateNote]);

  const togglePublic = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      await updateNote(noteId, { isPublic: !note.isPublic });
    }
  }, [notes, updateNote]);

  const filterNotes = useCallback((filters: NoteFilters) => {
    return notes.filter(note => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesTags = note.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      // Subject filter
      if (filters.subject && note.subject !== filters.subject) return false;

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(tag => note.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      // Favorites filter
      if (filters.showFavoritesOnly && !note.isFavorite) return false;

      // Public filter
      if (filters.showPublicOnly && !note.isPublic) return false;

      return true;
    });
  }, [notes]);

  const getNoteById = useCallback((noteId: string) => {
    return notes.find(note => note.id === noteId);
  }, [notes]);

  const getNotesBySubject = useCallback((subject: string) => {
    return notes.filter(note => note.subject === subject);
  }, [notes]);

  const getFavoriteNotes = useCallback(() => {
    return notes.filter(note => note.isFavorite);
  }, [notes]);

  const getRecentNotes = useCallback((limit = 10) => {
    return [...notes]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }, [notes]);

  return {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    togglePublic,
    filterNotes,
    getNoteById,
    getNotesBySubject,
    getFavoriteNotes,
    getRecentNotes,
  };
};
