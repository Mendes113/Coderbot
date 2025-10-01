/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    'createRule': '@request.auth.id != ""',
    'deleteRule': '@request.auth.role = "admin"',
    'fields': [
      {
        'autogeneratePattern': '[a-z0-9]{15}',
        'hidden': false,
        'id': 'text_pk_chat_interaction',
        'max': 15,
        'min': 15,
        'name': 'id',
        'pattern': '^[a-z0-9]+$',
        'presentable': false,
        'primaryKey': true,
        'required': true,
        'system': true,
        'type': 'text'
      },
      {
        'cascadeDelete': true,
        'collectionId': 'pbc_chat_sessions',
        'hidden': false,
        'id': 'rel_session',
        'maxSelect': 1,
        'minSelect': 1,
        'name': 'session',
        'presentable': false,
        'required': true,
        'system': false,
        'type': 'relation'
      },
      {
        'cascadeDelete': false,
        'collectionId': '_pb_users_auth_',
        'hidden': false,
        'id': 'rel_user',
        'maxSelect': 1,
        'minSelect': 1,
        'name': 'user',
        'presentable': false,
        'required': true,
        'system': false,
        'type': 'relation'
      },
      {
        'cascadeDelete': false,
        'collectionId': 'pbc_2478702895',
        'hidden': false,
        'id': 'rel_class',
        'maxSelect': 1,
        'minSelect': 0,
        'name': 'class',
        'presentable': false,
        'required': false,
        'system': false,
        'type': 'relation'
      },
      {
        'hidden': false,
        'id': 'sel_interaction_type',
        'maxSelect': 1,
        'name': 'interaction_type',
        'presentable': true,
        'required': true,
        'system': false,
        'type': 'select',
        'values': [
          'session_started',
          'message_sent',
          'message_received',
          'session_feedback'
        ]
      },
      {
        'hidden': false,
        'id': 'json_metadata',
        'name': 'metadata',
        'presentable': false,
        'required': false,
        'system': false,
        'type': 'json'
      },
      {
        'hidden': false,
        'id': 'autodate_created',
        'name': 'created',
        'onCreate': true,
        'onUpdate': false,
        'presentable': false,
        'system': false,
        'type': 'autodate'
      }
    ],
    'id': 'pbc_chat_interactions',
    'indexes': [
      'CREATE INDEX "idx_chat_interactions_session" ON "chat_interactions" ("session", "created")',
      'CREATE INDEX "idx_chat_interactions_user" ON "chat_interactions" ("user", "created")',
      'CREATE INDEX "idx_chat_interactions_class" ON "chat_interactions" ("class", "created")'
    ],
    'listRule': '@request.auth.id != "" && (user = @request.auth.id || class.createdBy ?= @request.auth.id || @request.auth.role = "admin")',
    'name': 'chat_interactions',
    'system': false,
    'type': 'base',
    'updateRule': '@request.auth.role = "admin"',
    'viewRule': '@request.auth.id != "" && (user = @request.auth.id || class.createdBy ?= @request.auth.id || @request.auth.role = "admin")'
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId('pbc_chat_interactions');
  return app.delete(collection);
})
