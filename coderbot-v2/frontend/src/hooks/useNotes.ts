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

type PocketBaseNoteRecord = {
  id: string;
  title?: string;
  content?: string;
  subject?: string | null;
  tags?: string[] | null;
  isFavorite?: boolean;
  isPublic?: boolean;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  created?: string;
  updated?: string;
};

type PersistedNoteRecord = {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  subject?: unknown;
  tags?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  isFavorite?: unknown;
  isPublic?: unknown;
  userId?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseDate = (value?: string | null): Date => {
  if (!value) {
    return new Date();
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? new Date() : new Date(timestamp);
};

const deserializeNotes = (raw: unknown): Note[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const record = item as PersistedNoteRecord;
      const id = typeof record.id === 'string' ? record.id : crypto.randomUUID();
      const title = typeof record.title === 'string' ? record.title : 'Nova anotação';
      const content = typeof record.content === 'string' ? record.content : '';
      const subject = typeof record.subject === 'string' ? record.subject : undefined;
      const userId = typeof record.userId === 'string'
        ? record.userId
        : undefined;
      const tags = Array.isArray(record.tags)
        ? record.tags.map(tag => String(tag))
        : [];

      return {
        id,
        title,
        content,
        subject,
        tags,
        createdAt: parseDate(typeof record.createdAt === 'string' ? record.createdAt : typeof record.createdAt === 'string' ? record.createdAt : undefined),
        updatedAt: parseDate(typeof record.updatedAt === 'string' ? record.updatedAt : typeof record.updatedAt === 'string' ? record.updatedAt : undefined),
        isFavorite: record.isFavorite === true,
        isPublic: record.isPublic === true,
        userId,
      } satisfies Note;
    })
    .filter((note): note is Note => Boolean(note));
};

const serializeNotes = (notesToPersist: Note[]): string =>
  JSON.stringify(
    notesToPersist.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })),
  );

const mapPocketBaseRecordToNote = (record: PocketBaseNoteRecord): Note => ({
  id: record.id,
  title: record.title ?? 'Nova anotação',
  content: record.content ?? '',
  subject: record.subject ?? undefined,
  tags: Array.isArray(record.tags) ? record.tags.map(tag => String(tag)) : [],
  createdAt: parseDate(record.createdAt ?? record.created),
  updatedAt: parseDate(record.updatedAt ?? record.updated),
  isFavorite: Boolean(record.isFavorite),
  isPublic: Boolean(record.isPublic),
  userId: record.userId ?? undefined,
});

const buildPocketBasePayload = (note: Note, overrides?: Partial<Note>) => {
  const source = { ...note, ...overrides };
  return {
    title: source.title,
    content: source.content,
    subject: source.subject ?? '',
    tags: source.tags ?? [],
    isFavorite: Boolean(source.isFavorite),
    isPublic: Boolean(source.isPublic),
    userId: source.userId ?? pb.authStore.model?.id,
  };
};

const sortNotes = (list: Note[]) =>
  [...list].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const persistNotesLocally = useCallback((notesToPersist: Note[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeNotes(notesToPersist));
    } catch (storageError) {
      console.warn('Failed to persist notes locally:', storageError);
    }
  }, []);

  const syncNotesState = useCallback((updater: (prev: Note[]) => Note[]) => {
    setNotes(prev => {
      const next = sortNotes(updater(prev));
      persistNotesLocally(next);
      return next;
    });
  }, [persistNotesLocally]);

  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true);
      try {
        const localNotesRaw = localStorage.getItem(STORAGE_KEY);
        if (localNotesRaw) {
          try {
            const parsed = deserializeNotes(JSON.parse(localNotesRaw));
            setNotes(sortNotes(parsed));
          } catch (parseError) {
            console.warn('Failed to parse local notes cache:', parseError);
          }
        }

        if (pb.authStore.isValid) {
          const userId = pb.authStore.model?.id;
          if (userId) {
            try {
              const remoteNotes = await pb.collection('notes').getFullList<PocketBaseNoteRecord>({
            filter: `userId = "${userId}"`,
          });
              const formatted = sortNotes(
                remoteNotes.map(note => mapPocketBaseRecordToNote(note)),
              );
              setNotes(formatted);
              persistNotesLocally(formatted);
            } catch (remoteError) {
              console.warn('Failed to load filtered notes from PocketBase, retrying without filter:', remoteError);
              try {
                const fallbackRemote = await pb.collection('notes').getFullList<PocketBaseNoteRecord>();
                const filtered = fallbackRemote.filter((record) => record.userId === userId);
                const formatted = sortNotes(
                  filtered.map(note => mapPocketBaseRecordToNote(note)),
                );
                setNotes(formatted);
                persistNotesLocally(formatted);
              } catch (fallbackError) {
                console.warn('Failed to load notes from PocketBase, using local cache only:', fallbackError);
              }
            }
          }
        }

        setError(null);
      } catch (loadError) {
        console.error('Error loading notes:', loadError);
        setError('Erro ao carregar anotações');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes().catch(() => undefined);
  }, [persistNotesLocally]);

  const resolveNoteData = (input: Partial<Note>, base?: Note): Note => ({
    id: base?.id ?? crypto.randomUUID(),
    title: input.title ?? base?.title ?? 'Nova anotação',
    content: input.content ?? base?.content ?? '',
    subject: input.subject ?? base?.subject,
    tags: input.tags ?? base?.tags ?? [],
    createdAt: base?.createdAt ?? new Date(),
    updatedAt: new Date(),
    isFavorite: input.isFavorite ?? base?.isFavorite ?? false,
    isPublic: input.isPublic ?? base?.isPublic ?? false,
    userId: input.userId ?? base?.userId,
  });

  const createNote = useCallback(async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const userId = pb.authStore.model?.id;
    const fallbackNote = resolveNoteData({
      ...noteData,
      tags: noteData.tags ?? [],
      subject: noteData.subject,
      isFavorite: noteData.isFavorite ?? false,
      isPublic: noteData.isPublic ?? false,
    });
    if (userId) {
      fallbackNote.userId = userId;
    }

    if (pb.authStore.isValid && userId) {
      try {
        const payload = {
          title: fallbackNote.title,
          content: fallbackNote.content,
          subject: fallbackNote.subject ?? '',
          tags: fallbackNote.tags,
          isFavorite: fallbackNote.isFavorite,
          isPublic: fallbackNote.isPublic,
          userId,
        };
        const record = await pb.collection('notes').create(payload);
        const createdNote = mapPocketBaseRecordToNote(record as PocketBaseNoteRecord);
        syncNotesState(prev => [createdNote, ...prev]);
        return createdNote;
      } catch (remoteError) {
        console.warn('Failed to create note on PocketBase, storing locally:', remoteError);
      }
    }

    syncNotesState(prev => [fallbackNote, ...prev]);
    return fallbackNote;
  }, [syncNotesState]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<Note>) => {
    const existing = notes.find(note => note.id === noteId);
    if (!existing) {
      return null;
    }

    const updatedNote = resolveNoteData({
      ...existing,
      ...updates,
      tags: updates.tags ?? existing.tags,
      subject: updates.subject ?? existing.subject,
      isFavorite: updates.isFavorite ?? existing.isFavorite,
      isPublic: updates.isPublic ?? existing.isPublic,
    }, existing);

    syncNotesState(prev => prev.map(note => (note.id === noteId ? updatedNote : note)));

    if (pb.authStore.isValid && (existing.userId || pb.authStore.model?.id)) {
      try {
        await pb.collection('notes').update(noteId, buildPocketBasePayload(updatedNote));
      } catch (remoteError) {
        console.warn('Failed to update note on PocketBase:', remoteError);
      }
    }

    return updatedNote;
  }, [notes, syncNotesState]);

  const deleteNote = useCallback(async (noteId: string) => {
    const existing = notes.find(note => note.id === noteId);
    syncNotesState(prev => prev.filter(note => note.id !== noteId));

    if (pb.authStore.isValid) {
      try {
        await pb.collection('notes').delete(noteId);
      } catch (remoteError) {
        console.warn('Failed to delete note from PocketBase:', remoteError);
      }
    }

    return existing ?? null;
  }, [notes, syncNotesState]);

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
