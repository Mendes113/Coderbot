/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('easter_egg_definitions');
  
  const newEasterEggs = [
    {
      name: 'clickomaniaco',
      display_name: 'Clickomaníaco',
      description: 'OK, já deu pra chamar atenção... CHEGA! 🤦‍♂️',
      trigger_type: 'clicks',
      trigger_config: {
        target: 'sidebar',
        requiredClicks: 30,
        timeWindow: 60000
      },
      achievement_message: 'Você desbloqueou: Clickomaníaco! 🖱️',
      points: 200,
      icon: '🖱️',
      is_active: true,
      category: 'ui_interaction',
      difficulty: 'hard'
    },
    {
      name: 'achievement_hunter',
      display_name: 'Caçador de Conquistas',
      description: 'Você tentou descobrir TODAS as conquistas secretas! 🕵️',
      trigger_type: 'clicks',
      trigger_config: {
        target: 'locked_achievements',
        requiredClicks: 10,
        timeWindow: 30000
      },
      achievement_message: 'Você desbloqueou: Caçador de Conquistas! 🔍',
      points: 150,
      icon: '🔍',
      is_active: true,
      category: 'exploration',
      difficulty: 'medium'
    },
    {
      name: 'konami_code',
      display_name: 'Lenda dos Games',
      description: 'Você desbloqueou o código lendário! ↑↑↓↓←→←→BA',
      trigger_type: 'sequence',
      trigger_config: {
        sequence: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA', 'Enter'],
        timeout: 10000
      },
      achievement_message: 'Você desbloqueou: Lenda dos Games! 🎮',
      points: 300,
      icon: '🎮',
      is_active: true,
      category: 'secret',
      difficulty: 'legendary'
    },
    {
      name: 'fire_streak',
      display_name: 'Streak de Fogo',
      description: 'Sua dedicação está em chamas! 7 dias consecutivos 🔥',
      trigger_type: 'time_based',
      trigger_config: {
        consecutive_days: 7
      },
      achievement_message: 'Você desbloqueou: Streak de Fogo! 🔥',
      points: 500,
      icon: '🔥',
      is_active: true,
      category: 'achievement',
      difficulty: 'legendary'
    },
    {
      name: 'early_bird',
      display_name: 'Madrugador do Código',
      description: 'O código madruga! Login entre 5h-7h da manhã 🌅',
      trigger_type: 'time_based',
      trigger_config: {
        hour_range: [5, 7]
      },
      achievement_message: 'Você desbloqueou: Madrugador do Código! 🌅',
      points: 100,
      icon: '🌅',
      is_active: true,
      category: 'achievement',
      difficulty: 'medium'
    },
    {
      name: 'night_owl',
      display_name: 'Coruja Noturna',
      description: 'A noite é uma criança! Login entre 1h-4h 🦉',
      trigger_type: 'time_based',
      trigger_config: {
        hour_range: [1, 4]
      },
      achievement_message: 'Você desbloqueou: Coruja Noturna! 🦉',
      points: 150,
      icon: '🦉',
      is_active: true,
      category: 'achievement',
      difficulty: 'hard'
    },
    {
      name: 'curious_mind',
      display_name: 'Mente Curiosa',
      description: 'A curiosidade move o mundo! 50 perguntas ao chatbot 🤔💡',
      trigger_type: 'combo',
      trigger_config: {
        action: 'chat_messages',
        requiredClicks: 50
      },
      achievement_message: 'Você desbloqueou: Mente Curiosa! 🤔',
      points: 200,
      icon: '🤔',
      is_active: true,
      category: 'achievement',
      difficulty: 'medium'
    },
    {
      name: 'vim_master',
      display_name: 'Vim Master',
      description: 'Um verdadeiro programador nunca esquece! Digite :wq ou :q! 🖥️',
      trigger_type: 'sequence',
      trigger_config: {
        text_sequence: [':wq', ':q!'],
        case_sensitive: true
      },
      achievement_message: 'Você desbloqueou: Vim Master! ⌨️',
      points: 150,
      icon: '⌨️',
      is_active: true,
      category: 'secret',
      difficulty: 'hard'
    },
    {
      name: 'treasure_hunter',
      display_name: 'Caçador de Tesouros',
      description: 'Você explorou cada canto da plataforma! 🗺️',
      trigger_type: 'combo',
      trigger_config: {
        action: 'visit_pages',
        required_pages: ['chat', 'profile', 'notes', 'whiteboard', 'exercises', 'forum'],
        in_order: false
      },
      achievement_message: 'Você desbloqueou: Caçador de Tesouros! 🗺️',
      points: 400,
      icon: '🗺️',
      is_active: true,
      category: 'exploration',
      difficulty: 'legendary'
    }
  ];

  // Inserir cada easter egg (ignora duplicatas)
  newEasterEggs.forEach(eggData => {
    try {
      // Verificar se já existe
      const existing = app.findFirstRecordByData('easter_egg_definitions', 'name', eggData.name);
      if (existing) {
        console.log(`[Seed] Easter egg "${eggData.name}" already exists, skipping...`);
        return;
      }

      // Criar novo record
      const record = new Record(collection);
      record.set('name', eggData.name);
      record.set('display_name', eggData.display_name);
      record.set('description', eggData.description);
      record.set('trigger_type', eggData.trigger_type);
      record.set('trigger_config', eggData.trigger_config);
      record.set('achievement_message', eggData.achievement_message);
      record.set('points', eggData.points);
      record.set('icon', eggData.icon);
      record.set('is_active', eggData.is_active);
      record.set('category', eggData.category);
      record.set('difficulty', eggData.difficulty);

      app.save(record);
      console.log(`[Seed] ✅ Easter egg "${eggData.display_name}" created successfully`);
    } catch (error) {
      console.error(`[Seed] ❌ Failed to create easter egg "${eggData.name}":`, error);
    }
  });
}, (app) => {
  // Rollback: remove os easter eggs criados
  const eggNames = [
    'clickomaniaco',
    'achievement_hunter',
    'konami_code', 
    'fire_streak',
    'early_bird',
    'night_owl',
    'curious_mind',
    'vim_master',
    'treasure_hunter'
  ];

  eggNames.forEach(name => {
    try {
      const record = app.findFirstRecordByData('easter_egg_definitions', 'name', name);
      if (record) {
        app.delete(record);
        console.log(`[Rollback] Deleted easter egg: ${name}`);
      }
    } catch (error) {
      console.error(`[Rollback] Failed to delete easter egg "${name}":`, error);
    }
  });
});
