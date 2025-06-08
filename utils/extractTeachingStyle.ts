export type LessonPlan = {
  unitGoal: string;
  evaluationPoints: {
    knowledge: string[];
    thinking: string[];
    attitude: string[];
  };
  childImage: string;
  languageActivities: string;
};

export type TeachingStyle = {
  philosophy: string;
  languageFocus: string;
  evaluationFocus: string;
  childFocus: string;
};

export function extractTeachingStyle(plans: LessonPlan[]): TeachingStyle {
  const getMostCommonPhrase = (texts: string[]): string => {
    const frequency: Record<string, number> = {};
    texts.forEach(text => {
      const words = text.split(/[、。\\n]/).filter(Boolean);
      words.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
      });
    });
    const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "";
  };

  const philosophy = getMostCommonPhrase(plans.map(p => p.unitGoal));
  const evaluationFocus = getMostCommonPhrase(
    plans.flatMap(p => [...p.evaluationPoints.knowledge, ...p.evaluationPoints.thinking, ...p.evaluationPoints.attitude])
  );
  const childFocus = getMostCommonPhrase(plans.map(p => p.childImage));
  const languageFocus = getMostCommonPhrase(plans.map(p => p.languageActivities));

  return {
    philosophy: philosophy || "（未抽出）",
    evaluationFocus: evaluationFocus || "（未抽出）",
    languageFocus: languageFocus || "（未抽出）",
    childFocus: childFocus || "（未抽出）",
  };
}
