/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3419561403");

  // Add class field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2478702895",
    "hidden": false,
    "id": "rel_class",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "class",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));

  // Add subject field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "text_subject",
    "max": 100,
    "min": 0,
    "name": "subject",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  // Add last_interaction field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "autodate_last_interaction",
    "name": "last_interaction",
    "onCreate": true,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }));

  // Add indexes for better query performance
  collection.indexes = [
    "CREATE INDEX `idx_chat_sessions_class` ON `chat_session` (`class`)",
    "CREATE INDEX `idx_chat_sessions_subject` ON `chat_session` (`subject`)",
    "CREATE INDEX `idx_chat_sessions_last_interaction` ON `chat_session` (`last_interaction`)"
  ];

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3419561403");

  // Remove the fields we added
  collection.fields.removeById("rel_class");
  collection.fields.removeById("text_subject");
  collection.fields.removeById("autodate_last_interaction");

  // Restore original indexes (if any)
  collection.indexes = [];

  return app.save(collection);
})
