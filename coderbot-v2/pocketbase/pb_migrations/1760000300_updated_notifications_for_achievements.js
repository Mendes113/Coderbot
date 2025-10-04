/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("notifications")

  // Adicionar campo 'type' se não existir (pode já existir)
  // Adicionar opção 'achievement' aos valores existentes
  const typeField = collection.schema.fields().find(f => f.name === "type")
  if (typeField) {
    // Se já existe, adicionar 'achievement' aos valores se não estiver lá
    if (!typeField.options.values.includes("achievement")) {
      typeField.options.values.push("achievement")
    }
  } else {
    // Se não existe, criar campo type
    collection.schema.addField(new SchemaField({
      "system": false,
      "id": "type_field",
      "name": "type",
      "type": "select",
      "required": false,
      "presentable": false,
      "unique": false,
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

  // Adicionar campo achievement_id
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "achievement_id",
    "name": "achievement_id",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "user_achievements_id",
      "cascadeDelete": true,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": ["display_name"]
    }
  }))

  // Adicionar campo icon
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "icon",
    "name": "icon",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": 10,
      "pattern": ""
    }
  }))

  // Adicionar campo animation
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "animation",
    "name": "animation",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
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
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "priority",
    "name": "priority",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
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

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("notifications")

  // Remover campos adicionados
  collection.schema.removeField("achievement_id")
  collection.schema.removeField("icon")
  collection.schema.removeField("animation")
  collection.schema.removeField("priority")

  // Remover 'achievement' do type field se foi adicionado
  const typeField = collection.schema.fields().find(f => f.name === "type")
  if (typeField) {
    const index = typeField.options.values.indexOf("achievement")
    if (index > -1) {
      typeField.options.values.splice(index, 1)
    }
  }

  return dao.saveCollection(collection)
});
