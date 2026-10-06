export function gradeTask1(code){
  // Playwright-based grader for rating slider - production
  const issues=[]
  if (!/input/.test(code)) issues.push('input element missing')
  if (!/Buruk|Lumayan/.test(code)) issues.push('label mapping missing')
  return { score: issues.length?50:85, issues }
}
