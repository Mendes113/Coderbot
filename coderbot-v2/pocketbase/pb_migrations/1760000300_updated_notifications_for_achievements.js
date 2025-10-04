/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("notifications")

  // Try to get field by name, if it doesn't exist, add it
  try {
    collection.fields.getByName("type");
  } catch(e) {
    // Field doesn't exist, add it
    collection.fields.add(new Field({
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
  }

  // Try to add achievement_id field
  try {
    collection.fields.getByName("achievement_id");
  } catch(e) {
    const userAchievementsCollection = app.findCollectionByNameOrId("user_achievements");
    collection.fields.add(new Field({
      "name": "achievement_id",
      "type": "relation",
      "required": false,
      "presentable": false,
      "options": {
        "collectionId": userAchievementsCollection.id,
        "cascadeDelete": true,
        "minSelect": null,
        "maxSelect": 1,
        "displayFields": ["display_name"]
      }
    }))
  }

  // Try to add icon field
  try {
    collection.fields.getByName("icon");
  } catch(e) {
    collection.fields.add(new Field({
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
  }

  // Try to add animation field
  try {
    collection.fields.getByName("animation");
  } catch(e) {
    collection.fields.add(new Field({
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
  }

  // Try to add priority field
  try {
    collection.fields.getByName("priority");
  } catch(e) {
    collection.fields.add(new Field({
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
  }

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("notifications")

  // Remover campos adicionados - ignore errors if field doesn't exist
  try {
    const field = collection.fields.getByName("priority");
    collection.fields.removeById(field.id);
  } catch(e) {}
  
  try {
    const field = collection.fields.getByName("animation");
    collection.fields.removeById(field.id);
  } catch(e) {}
  
  try {
    const field = collection.fields.getByName("icon");
    collection.fields.removeById(field.id);
  } catch(e) {}
  
  try {
    const field = collection.fields.getByName("achievement_id");
    collection.fields.removeById(field.id);
  } catch(e) {}

  return app.save(collection)
});
