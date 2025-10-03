/// <reference path="../pb_data/types.d.ts" />
/**
 * Migration: Add source tracking fields to notifications
 * 
 * Adiciona campos para rastrear a origem de notificações:
 * - source_type: Tipo de origem (chat, forum, class, exercise, etc)
 * - source_id: ID do registro de origem
 * - source_url: URL direta para o contexto
 * - read_at: Timestamp de quando foi lida
 * 
 * Também atualiza os tipos de notificação para incluir 'message' e 'comment'
 */
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_notifications");

  // Atualizar o campo 'type' para incluir novos valores
  const typeField = collection.fields.getById("sel_type");
  typeField.values = [
    "message",        // Nova mensagem no chat
    "mention",        // Menção em mensagem/comentário
    "comment",        // Comentário em post/exercício
    "reply",          // Resposta a comentário
    "forum_reply",    // Resposta em fórum
    "class_invite",   // Convite para turma
    "system",         // Notificação do sistema
    "achievement",    // Conquista desbloqueada
    "assignment",     // Nova tarefa atribuída
    "grade"           // Nota recebida
  ];

  // Adicionar campo source_type (tipo de origem)
  collection.fields.add({
    "hidden": false,
    "id": "sel_source_type",
    "maxSelect": 1,
    "name": "source_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "chat_message",      // Mensagem de chat
      "forum_post",        // Post no fórum
      "forum_comment",     // Comentário no fórum
      "exercise",          // Exercício
      "exercise_comment",  // Comentário em exercício
      "class",             // Turma
      "assignment",        // Tarefa/trabalho
      "whiteboard",        // Quadro branco
      "note",              // Nota/anotação
      "system"             // Sistema
    ]
  });

  // Adicionar campo source_id (ID do registro de origem)
  collection.fields.add({
    "hidden": false,
    "id": "text_source_id",
    "max": 50,
    "min": 0,
    "name": "source_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  });

  // Adicionar campo source_url (URL direta para o contexto)
  collection.fields.add({
    "convertUrls": false,
    "hidden": false,
    "id": "url_source_url",
    "max": 500,
    "min": 0,
    "name": "source_url",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "url"
  });

  // Adicionar campo read_at (timestamp de quando foi lida)
  collection.fields.add({
    "hidden": false,
    "id": "date_read_at",
    "name": "read_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  });

  // Atualizar índices para melhor performance
  collection.indexes = [
    "CREATE INDEX `idx_notifications_recipient` ON `notifications` (`recipient`)",
    "CREATE INDEX `idx_notifications_read` ON `notifications` (`read`)",
    "CREATE INDEX `idx_notifications_type` ON `notifications` (`type`)",
    "CREATE INDEX `idx_notifications_created` ON `notifications` (`created`)",
    "CREATE INDEX `idx_notifications_source` ON `notifications` (`source_type`, `source_id`)"
  ];

  return app.save(collection);
}, (app) => {
  // Rollback: reverter para o schema original
  const collection = app.findCollectionByNameOrId("pbc_notifications");

  // Remover os campos adicionados
  collection.fields.removeById("sel_source_type");
  collection.fields.removeById("text_source_id");
  collection.fields.removeById("url_source_url");
  collection.fields.removeById("date_read_at");

  // Reverter o campo type para os valores originais
  const typeField = collection.fields.getById("sel_type");
  typeField.values = [
    "mention",
    "forum_reply",
    "class_invite",
    "system",
    "achievement"
  ];

  // Reverter índices
  collection.indexes = [
    "CREATE INDEX `idx_notifications_recipient` ON `notifications` (`recipient`)",
    "CREATE INDEX `idx_notifications_read` ON `notifications` (`read`)",
    "CREATE INDEX `idx_notifications_type` ON `notifications` (`type`)",
    "CREATE INDEX `idx_notifications_created` ON `notifications` (`created`)"
  ];

  return app.save(collection);
});

