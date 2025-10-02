import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pb } from '@/integrations/pocketbase/client';
import { getCurrentUser } from '@/integrations/pocketbase/client';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  collectionId?: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  classId?: string; // ID da turma para filtrar usuários
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  placeholder = "Digite sua mensagem...",
  disabled = false,
  className,
  rows = 3,
  classId,
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentUser = getCurrentUser();

  // Buscar usuários para menções
  const fetchUsers = useCallback(async (force = false) => {
    // Se já temos usuários e não é forçado, não buscar novamente
    if (users.length > 0 && !force) {
      return;
    }

    console.log('Iniciando busca de usuários:', { classId, force, currentUsers: users.length });

    try {
      if (classId) {
        // Buscar membros da turma específica
        const membersResponse = await pb.collection('class_members').getFullList({
          filter: `class = "${classId}"`,
          fields: 'user'
        });

        if (membersResponse.length === 0) {
          setUsers([]);
          return;
        }

        const memberIds = membersResponse
          .map(member => member.user)
          .filter(id => id && typeof id === 'string' && id.trim().length > 0);

        console.log('IDs de membros encontrados:', memberIds);

        if (memberIds.length === 0) {
          console.warn('Nenhum membro válido encontrado na turma:', classId);
          setUsers([]);
          return;
        }

        const memberIdsString = memberIds.map(id => `"${id}"`).join(',');

        console.log('Buscando usuários da turma:', { classId, memberIdsCount: memberIds.length, memberIdsString });

        // Se não há membros válidos, não faz sentido buscar usuários
        if (memberIds.length === 0) {
          console.warn('Nenhum membro válido na turma - pulando busca de usuários');
          setUsers([]);
          return;
        }

        // Verificar se há IDs válidos antes de fazer a consulta
        if (memberIdsString.trim() === '') {
          console.warn('Nenhum ID válido para buscar usuários');
          setUsers([]);
          return;
        }

        try {
          const response = await pb.collection('users').getList(1, 50, {
            filter: `id in (${memberIdsString})`,
            sort: 'name',
            fields: 'id,name,email,avatar'
          });

          console.log('Resposta da busca de usuários:', { count: response.items.length, totalItems: response.totalItems });
          setUsers(response.items as unknown as User[]);
        } catch (error) {
          console.error('Erro na consulta de usuários:', error);

          // Se a consulta falhou devido a IDs inválidos, tentar buscar todos os usuários como fallback
          if (error.message && error.message.includes('400')) {
            console.warn('Tentando fallback: buscar todos os usuários');
            try {
              const fallbackResponse = await pb.collection('users').getList(1, 50, {
                sort: 'name',
                fields: 'id,name,email,avatar'
              });
              setUsers(fallbackResponse.items as unknown as User[]);
            } catch (fallbackError) {
              console.error('Erro no fallback:', fallbackError);
              setUsers([]);
            }
          } else {
            setUsers([]);
          }
        }
      } else {
        // Buscar todos os usuários (fallback para casos sem classId ou quando não há membros na turma)
        console.log('Buscando todos os usuários (sem filtro de turma)');
        try {
          const response = await pb.collection('users').getList(1, 50, {
            sort: 'name',
            fields: 'id,name,email,avatar'
          });
          console.log('Resposta da busca de todos os usuários:', { count: response.items.length });
          setUsers(response.items as unknown as User[]);
        } catch (error) {
          console.error('Erro ao buscar todos os usuários:', error);
          setUsers([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setUsers([]);
    }
  }, [classId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Buscar usuários quando o componente ganha foco e não há usuários
  useEffect(() => {
    const handleFocus = () => {
      if (users.length === 0 && classId) {
        console.log('Textarea focado - buscando usuários novamente');
        fetchUsers(true); // Forçar busca mesmo se já foi tentada
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('focus', handleFocus);
      return () => textarea.removeEventListener('focus', handleFocus);
    }
  }, [users.length, classId, fetchUsers]);

  // Buscar usuários se não houver nenhum e estivermos com classId
  useEffect(() => {
    if (classId && users.length === 0) {
      console.log('Componente montado sem usuários - iniciando busca');
      fetchUsers(true);
    }
  }, [classId, users.length, fetchUsers]);

  // Filtrar usuários baseado na query de menção
  useEffect(() => {
    if (mentionQuery) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(mentionQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
      setSelectedUserIndex(0);
    } else {
      setFilteredUsers([]);
    }
  }, [mentionQuery, users]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Verificar se o usuário está digitando uma menção
    const beforeCursor = newValue.substring(0, cursorPosition);
    const afterCursor = newValue.substring(cursorPosition);

    // Regex para detectar @ seguido de texto
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];

      // Se não há usuários carregados, tentar buscar novamente
      if (users.length === 0 && classId && query.length >= 1) {
        console.log('Tentando buscar usuários novamente para menções');
        fetchUsers().then(() => {
          setMentionQuery(query);
          setShowMentions(true);
        }).catch((error) => {
          console.error('Erro ao buscar usuários para menções:', error);
          setMentionQuery('');
          setShowMentions(false);
        });
        return;
      }

      setMentionQuery(query);

      // Calcular posição do popup de menções
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const style = window.getComputedStyle(textarea);
        const lineHeight = parseInt(style.lineHeight);
        const lines = beforeCursor.split('\n').length;
        const charInLine = beforeCursor.split('\n').pop()?.length || 0;

        setMentionPosition({
          top: lines * lineHeight + 20,
          left: charInLine * 8, // aproximado
        });
      }

      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }

    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentions || filteredUsers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedUserIndex(prev =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedUserIndex(prev =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredUsers[selectedUserIndex]) {
          insertMention(filteredUsers[selectedUserIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowMentions(false);
        setMentionQuery('');
        break;
    }
  };

  const insertMention = (user: User) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0;
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);

    // Substituir @query pelo @username
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const beforeMention = beforeCursor.substring(0, mentionMatch.index);
      const newValue = `${beforeMention}@${user.name} ${afterCursor}`;
      onChange(newValue);

      setShowMentions(false);
      setMentionQuery('');

      // Focar novamente no textarea e posicionar cursor
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = beforeMention.length + user.name.length + 2; // +2 para @ e espaço
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  const handleUserSelect = (user: User) => {
    insertMention(user);
  };

  const renderHighlightedText = (text: string) => {
    // Destacar menções no texto
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span key={index} className="bg-primary/10 text-primary px-1 py-0.5 rounded text-sm font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          "resize-none",
          showMentions && "ring-2 ring-primary/20",
          className
        )}
      />

      {/* Popup de menções */}
      {showMentions && filteredUsers.length > 0 && (
        <Card className="absolute z-50 w-64 mt-1 shadow-lg border">
          <CardContent className="p-2">
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {filteredUsers.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {users.length === 0 ?
                      'Nenhum usuário disponível para menções. Certifique-se de que há membros na turma.' :
                      'Nenhum usuário encontrado com esses critérios'
                    }
                  </div>
                ) : (
                  filteredUsers.map((user, index) => (
                  <Button
                    key={user.id}
                    variant={index === selectedUserIndex ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-2"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                        {user.avatar && user.collectionId ? (
                          <img
                            src={`${pb.baseUrl}/api/files/${user.collectionId}/${user.id}/${user.avatar}`}
                            alt={user.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="font-medium text-sm truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email || ''}
                        </div>
                      </div>
                    </div>
                  </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Visualização das menções no texto (opcional) */}
      {value.includes('@') && (
        <div className="mt-2 p-2 bg-muted/50 rounded-md text-sm">
          <div className="text-xs text-muted-foreground mb-1">Pré-visualização:</div>
          <div className="text-foreground">
            {renderHighlightedText(value)}
          </div>
        </div>
      )}
    </div>
  );
};
