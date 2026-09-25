import { NPSCategory, NPSMetrics, NPSDistributionItem, SurveyResponse } from '../types/nps';

export function getClassification(score: number): NPSCategory {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export function getClassificationLabel(category: NPSCategory): string {
  switch (category) {
    case 'promoter':
      return 'Promotor';
    case 'passive':
      return 'Neutro';
    case 'detractor':
      return 'Detrator';
  }
}

export function formatNPSScore(score: number): string {
  if (isNaN(score)) return '0';
  const rounded = Math.round(score);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function getNPSZone(score: number) {
  if (score >= 75) {
    return {
      name: 'Zona de Excelência',
      description: 'Clientes altamente engajados e defensores leais da marca (75 a 100).',
      color: '#059669', // Emerald 600
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    };
  }
  if (score >= 50) {
    return {
      name: 'Zona de Qualidade',
      description: 'Clientes satisfeitos com boa probabilidade de retenção (50 a 74).',
      color: '#2563EB', // Blue 600
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-700 dark:text-blue-400',
    };
  }
  if (score >= 0) {
    return {
      name: 'Zona de Aperfeiçoamento',
      description: 'Oportunidades de melhorias identificadas para evitar churn (0 a 49).',
      color: '#D97706', // Amber 600
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      textColor: 'text-amber-700 dark:text-amber-400',
    };
  }
  return {
    name: 'Zona Crítica',
    description: 'Nível elevado de insatisfação exigindo ação imediata (-100 a -1).',
    color: '#DC2626', // Red 600
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-400',
  };
}

export function calculateNPSMetrics(responses: SurveyResponse[], totalSent = 0): NPSMetrics {
  const totalResponses = responses.length;

  // Default distribution from 0 to 10
  const distributionMap: Record<number, number> = {};
  for (let i = 0; i <= 10; i++) {
    distributionMap[i] = 0;
  }

  let promotersCount = 0;
  let passivesCount = 0;
  let detractorsCount = 0;

  responses.forEach((resp) => {
    const score = Math.max(0, Math.min(10, Math.round(resp.nps_score)));
    distributionMap[score] = (distributionMap[score] || 0) + 1;

    const classification = getClassification(score);
    if (classification === 'promoter') promotersCount++;
    else if (classification === 'passive') passivesCount++;
    else detractorsCount++;
  });

  const promotersPercent = totalResponses > 0 ? (promotersCount / totalResponses) * 100 : 0;
  const passivesPercent = totalResponses > 0 ? (passivesCount / totalResponses) * 100 : 0;
  const detractorsPercent = totalResponses > 0 ? (detractorsCount / totalResponses) * 100 : 0;

  // Formula: NPS = % Promotores - % Detratores
  const npsScore = Math.round(promotersPercent - detractorsPercent);

  const effectiveTotalSent = Math.max(totalSent, totalResponses);
  const responseRate = effectiveTotalSent > 0 ? (totalResponses / effectiveTotalSent) * 100 : 0;

  const scoreDistribution: NPSDistributionItem[] = [];
  for (let score = 0; score <= 10; score++) {
    const count = distributionMap[score] || 0;
    const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
    scoreDistribution.push({
      score,
      count,
      percentage: Number(percentage.toFixed(1)),
      classification: getClassification(score),
    });
  }

  return {
    totalSent: effectiveTotalSent,
    totalResponses,
    responseRate: Number(responseRate.toFixed(1)),
    promotersCount,
    promotersPercent: Number(promotersPercent.toFixed(1)),
    passivesCount,
    passivesPercent: Number(passivesPercent.toFixed(1)),
    detractorsCount,
    detractorsPercent: Number(detractorsPercent.toFixed(1)),
    npsScore,
    scoreDistribution,
    zone: getNPSZone(npsScore),
  };
}

export function calculateTimelineTrend(responses: SurveyResponse[]) {
  if (responses.length === 0) return [];

  // Group by date YYYY-MM-DD
  const sorted = [...responses].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const dailyGroups: Record<string, number[]> = {};
  sorted.forEach((r) => {
    const dateStr = r.created_at.split('T')[0];
    if (!dailyGroups[dateStr]) {
      dailyGroups[dateStr] = [];
    }
    dailyGroups[dateStr].push(r.nps_score);
  });

  const accumulatedScores: number[] = [];
  return Object.keys(dailyGroups).map((date) => {
    accumulatedScores.push(...dailyGroups[date]);
    const total = accumulatedScores.length;
    let prom = 0;
    let det = 0;
    accumulatedScores.forEach((s) => {
      if (s >= 9) prom++;
      else if (s <= 6) det++;
    });
    const nps = Math.round(((prom - det) / total) * 100);

    const parts = date.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}`;

    return {
      date: formattedDate,
      fullDate: date,
      score: nps,
      responsesCount: total,
    };
  });
}
