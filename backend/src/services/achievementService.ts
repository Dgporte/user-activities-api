import * as achievementRepository from "../repository/achievement-repository";

// Define as conquistas padrão do sistema
const DEFAULT_ACHIEVEMENTS = [
  {
    name: "Primeiro Check-in",
    criterion: "Confirmar presença em uma atividade pela primeira vez",
  },
  {
    name: "Criador de Atividade",
    criterion: "Criar uma atividade pela primeira vez",
  },
  {
    name: "Conclusão de Atividade",
    criterion: "Concluir (encerrar) uma atividade pela primeira vez",
  },
  {
    name: "Subida de Nível",
    criterion: "Subir de nível pela primeira vez",
  },
  {
    name: "Personalização de Perfil",
    criterion: "Alterar a foto de perfil pela primeira vez",
  },
];

// Inicializa as conquistas no banco de dados
export async function initializeAchievements() {
  const achievementsCount = await achievementRepository.getCount();
  if (DEFAULT_ACHIEVEMENTS.length <= achievementsCount) return;

  await achievementRepository.createMany(DEFAULT_ACHIEVEMENTS);
}

export async function getAchievementByName(name: string) {
  return await achievementRepository.findByName(name);
}

export async function getAllAchievements() {
  return await achievementRepository.getAllAchievements();
}
