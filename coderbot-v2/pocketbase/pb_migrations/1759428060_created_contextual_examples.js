/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  let existingCollection = null

  try {
    existingCollection = app.findCollectionByNameOrId("contextual_examples")
  } catch (_) {
    existingCollection = null
  }

  if (existingCollection) {
    return existingCollection
  }

  const collection = new Collection({
    "name": "contextual_examples",
    "type": "base",
    "system": false,
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": null,
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_user_query",
        "max": 0,
        "min": 0,
        "name": "user_query",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_chat_session_id",
        "max": 0,
        "min": 0,
        "name": "chat_session_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_class_missions",
        "hidden": false,
        "id": "rel_mission_id",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "mission_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2478702895",
        "hidden": false,
        "id": "rel_class_id",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "class_id",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "sel_type",
        "maxSelect": 1,
        "name": "type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "correct",
          "incorrect"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_title",
        "max": 255,
        "min": 1,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_code",
        "max": 10000,
        "min": 0,
        "name": "code",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_language",
        "max": 50,
        "min": 1,
        "name": "language",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_explanation",
        "max": 0,
        "min": 0,
        "name": "explanation",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_methodology",
        "max": 100,
        "min": 0,
        "name": "methodology",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "sel_difficulty",
        "maxSelect": 1,
        "name": "difficulty",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "beginner",
          "intermediate",
          "advanced"
        ]
      },
      {
        "hidden": false,
        "id": "json_topics",
        "maxSize": 2000000,
        "name": "topics",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_agno_response_id",
        "max": 0,
        "min": 0,
        "name": "agno_response_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "num_segment_index",
        "max": null,
        "min": null,
        "name": "segment_index",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "num_upvotes",
        "max": null,
        "min": 0,
        "name": "upvotes",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "num_downvotes",
        "max": null,
        "min": 0,
        "name": "downvotes",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "num_quality_score",
        "max": 1,
        "min": 0,
        "name": "quality_score",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "num_usage_count",
        "max": null,
        "min": 0,
        "name": "usage_count",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_qdrant_point_id",
        "max": 0,
        "min": 0,
        "name": "qdrant_point_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_embedding_model",
        "max": 100,
        "min": 0,
        "name": "embedding_model",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_contextual_examples_mission_id` ON `contextual_examples` (`mission_id`)",
      "CREATE INDEX `idx_contextual_examples_class_id` ON `contextual_examples` (`class_id`)",
      "CREATE INDEX `idx_contextual_examples_quality_score` ON `contextual_examples` (`quality_score`)",
      "CREATE INDEX `idx_contextual_examples_chat_session_id` ON `contextual_examples` (`chat_session_id`)"
    ]
  });

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("contextual_examples");
    return app.delete(collection);
  } catch (_) {
    return
  }
});
