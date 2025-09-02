/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    id: "pbc_flashcards",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    name: "flashcards",
    type: "base",
    system: false,
    fields: [
      {
        id: "text_pk",
        name: "id",
        type: "text",
        system: true,
        primaryKey: true,
        required: true,
        hidden: false,
        presentable: false,
        min: 15,
        max: 15,
        pattern: "^[a-z0-9]+$",
        autogeneratePattern: "[a-z0-9]{15}"
      },
      {
        id: "text_user",
        name: "user_id",
        type: "text",
        system: false,
        required: true,
        hidden: false,
        presentable: false,
        min: 0,
        max: 0,
        pattern: ""
      },
      {
        id: "text_q",
        name: "question",
        type: "text",
        system: false,
        required: true,
        hidden: false,
        presentable: false,
        min: 0,
        max: 0,
        pattern: ""
      },
      {
        id: "text_a",
        name: "answer",
        type: "text",
        system: false,
        required: true,
        hidden: false,
        presentable: false,
        min: 0,
        max: 0,
        pattern: ""
      },
      {
        id: "json_tags",
        name: "tags",
        type: "json",
        system: false,
        required: false,
        hidden: false,
        presentable: false
      },
      {
        id: "autodate_created",
        name: "created",
        type: "autodate",
        system: false,
        onCreate: true,
        onUpdate: false,
        hidden: false,
        presentable: false
      },
      {
        id: "autodate_updated",
        name: "updated",
        type: "autodate",
        system: false,
        onCreate: true,
        onUpdate: true,
        hidden: false,
        presentable: false
      }
    ],
    indexes: [
      "CREATE INDEX `idx_flashcards_user_id` ON `flashcards` (`user_id`)"
    ],
    listRule: "@request.auth.id = user_id",
    viewRule: "@request.auth.id = user_id",
    createRule: "@request.auth.id = user_id",
    updateRule: "@request.auth.id = user_id",
    deleteRule: "@request.auth.id = user_id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_flashcards");
  return app.delete(collection);
});
