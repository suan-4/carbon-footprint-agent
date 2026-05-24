// suggestionService.js 示例
import { adviceList } from './reductionAdvice';

export function getMatchingAdvice(userEmissionData) {
  const suggestions = [];

  // 假设 userEmissionData 结构：{ transport: 50, diet: 30, energy: 20 }
  for (const advice of adviceList) {
    // 简单匹配逻辑：如果该类目的排放量大于某个阈值，就推荐
    if (userEmissionData[advice.category] > 30) {
      suggestions.push(advice);
    }
  }

  return suggestions;
}
