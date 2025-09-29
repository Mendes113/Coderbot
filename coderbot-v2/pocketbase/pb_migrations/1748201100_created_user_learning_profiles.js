/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id = user_id",
    "deleteRule": "@request.auth.id = user_id", 
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
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
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation3545646658",
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
        "id": "select1234567890",
        "maxSelect": 1,
        "name": "learning_style",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "visual",
          "auditory", 
          "kinesthetic",
          "read_write"
        ]
      },
      {
        "hidden": false,
        "id": "select2345678901",
        "maxSelect": 1,
        "name": "pace_preference",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "slow",
          "normal",
          "fast"
        ]
      },
      {
        "hidden": false,
        "id": "select3456789012",
        "maxSelect": 1,
        "name": "preferred_difficulty",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "beginner",
          "intermediate",
          "advanced",
          "expert"
        ]
      },
      {
        "hidden": false,
        "id": "number4567890123",
        "max": null,
        "min": 0,
        "name": "current_streak",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number5678901234", 
        "max": null,
        "min": 0,
        "name": "total_study_time_hours",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json6789012345",
        "name": "concept_masteries",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "json7890123456",
        "name": "learning_goals",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "json8901234567",
        "name": "weak_areas",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "json9012345678",
        "name": "strong_areas", 
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number0123456789",
        "max": 1,
        "min": 0.1,
        "name": "cognitive_load_capacity",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2478702896",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_unique_user_profile` ON `user_learning_profiles` (`user_id`)"
    ],
    "listRule": "@request.auth.id = user_id",
    "name": "user_learning_profiles",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = user_id",
    "viewRule": "@request.auth.id = user_id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2478702896");

  return app.delete(collection);
}) 