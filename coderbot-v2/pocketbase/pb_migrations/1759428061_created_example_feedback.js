/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let contextualExamplesCollection
  try {
    contextualExamplesCollection = app.findCollectionByNameOrId("contextual_examples")
  } catch (_) {
    contextualExamplesCollection = null
  }

  if (!contextualExamplesCollection) {
    throw new Error("contextual_examples collection must exist before creating example_feedback")
  }

  let existingCollection = null
  try {
    existingCollection = app.findCollectionByNameOrId("example_feedback")
  } catch (_) {
    existingCollection = null
  }

  if (existingCollection) {
    return existingCollection
  }

  const collection = new Collection({
    "name": "example_feedback",
    "type": "base",
    "system": false,
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id = user_id",
    "deleteRule": "@request.auth.id = user_id",
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_id",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": contextualExamplesCollection.id,
        "hidden": false,
        "id": "rel_example_id",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "example_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "rel_user_id",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "sel_vote",
        "maxSelect": 1,
        "name": "vote",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "up",
          "down"
        ]
      },
      {
        "hidden": false,
        "id": "sel_feedback_type",
        "maxSelect": 1,
        "name": "feedback_type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "helpful",
          "not_helpful",
          "incorrect",
          "needs_improvement"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_comment",
        "max": 1000,
        "min": 0,
        "name": "comment",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json_context",
        "maxSize": 2000000,
        "name": "context",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_example_feedback_user_example` ON `example_feedback` (`user_id`, `example_id`)",
      "CREATE INDEX `idx_example_feedback_example_id` ON `example_feedback` (`example_id`)",
      "CREATE INDEX `idx_example_feedback_vote` ON `example_feedback` (`vote`)"
    ]
  });

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("example_feedback")
    return app.delete(collection)
  } catch (_) {
    return
  }
});
