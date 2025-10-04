/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("notifications")

  // Adicionar campo 'type' para achievement
  collection.fields.addAt(10, new Field({
    "name": "type",
    "type": "select",
    "required": false,
    "presentable": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "info",
        "warning",
        "error",
        "success",
        "achievement"
      ]
    }
  }))

  // Adicionar campo achievement_id
  collection.fields.addAt(11, new Field({
    "name": "achievement_id",
    "type": "relation",
    "required": false,
    "presentable": false,
    "options": {
      "collectionId": "user_achievements",
      "cascadeDelete": true,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": ["display_name"]
    }
  }))

  // Adicionar campo icon
  collection.fields.addAt(12, new Field({
    "name": "icon",
    "type": "text",
    "required": false,
    "presentable": false,
    "options": {
      "min": null,
      "max": 10,
      "pattern": ""
    }
  }))

  // Adicionar campo animation
  collection.fields.addAt(13, new Field({
    "name": "animation",
    "type": "select",
    "required": false,
    "presentable": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "shake",
        "bounce",
        "glow",
        "confetti"
      ]
    }
  }))

  // Adicionar campo priority
  collection.fields.addAt(14, new Field({
    "name": "priority",
    "type": "select",
    "required": false,
    "presentable": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "low",
        "normal",
        "high",
        "urgent"
      ]
    }
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("notifications")

  // Remover campos adicionados (em ordem reversa)
  collection.fields.removeById("priority")
  collection.fields.removeById("animation")
  collection.fields.removeById("icon")
  collection.fields.removeById("achievement_id")
  collection.fields.removeById("type")

  return app.save(collection)
});
