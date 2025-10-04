/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("easter_egg_definitions");

  // Easter Egg 1: Notification Clicks
  const record1 = new Record(collection, {
    "name": "notification_clicks",
    "display_name": "Mestre das Notificações",
    "description": "Descobriu o segredo das notificações clicando 3 vezes!",
    "trigger_type": "clicks",
    "trigger_config": {
      "requiredClicks": 3,
      "timeWindow": 1000,
      "resetOnDelay": true
    },
    "achievement_message": "🎉 Parabéns! Você descobriu um dos segredos escondidos do CoderBot!",
    "points": 50,
    "icon": "🔔",
    "is_active": true,
    "category": "ui_interaction",
    "difficulty": "medium"
  });
  app.save(record1);

  // Easter Egg 2: Avatar Explorer
  const record2 = new Record(collection, {
    "name": "avatar_explorer",
    "display_name": "Explorador de Avatares",
    "description": "Descobriu que o avatar tem vida própria!",
    "trigger_type": "clicks",
    "trigger_config": {
      "requiredClicks": 3,
      "timeWindow": 1000,
      "resetOnDelay": false
    },
    "achievement_message": "🧙‍♂️ Uau! Você descobriu que seu avatar tem poderes especiais!",
    "points": 25,
    "icon": "👤",
    "is_active": true,
    "category": "exploration",
    "difficulty": "easy"
  });
  app.save(record2);

  // Easter Egg 3: Theme Master
  const record3 = new Record(collection, {
    "name": "theme_master",
    "display_name": "Mestre dos Temas",
    "description": "Dominou os segredos da personalização visual!",
    "trigger_type": "clicks",
    "trigger_config": {
      "requiredClicks": 3,
      "timeWindow": 1000,
      "resetOnDelay": true
    },
    "achievement_message": "✨ Incrível! Você desbloqueou os poderes ocultos da personalização de temas!",
    "points": 75,
    "icon": "🎨",
    "is_active": true,
    "category": "ui_interaction",
    "difficulty": "hard"
  });
  app.save(record3);

  // Easter Egg 4: Konami Code
  const record4 = new Record(collection, {
    "name": "konami_code",
    "display_name": "Gamer Nostálgico",
    "description": "Descobriu o código secreto dos games clássicos!",
    "trigger_type": "sequence",
    "trigger_config": {
      "sequence": ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"],
      "timeWindow": 5000
    },
    "achievement_message": "�� LEGENDARY! Você conhece a história dos games!",
    "points": 150,
    "icon": "🕹️",
    "is_active": true,
    "category": "secret",
    "difficulty": "legendary"
  });
  app.save(record4);
}, (app) => {
  const collection = app.findCollectionByNameOrId("easter_egg_definitions");
  const names = ["notification_clicks", "avatar_explorer", "theme_master", "konami_code"];
  names.forEach(name => {
    try {
      const record = app.findFirstRecordByFilter(collection.id, `name = "${name}"`);
      if (record) app.delete(record);
    } catch (e) {}
  });
});
