const CHINESE_CHARACTER = /^[\u3400-\u4dbf\u4e00-\u9fff]$/u;

export function validateCharacter(value) {
  const characters = Array.from(value.trim());

  if (characters.length === 0) {
    return { valid: false, message: "请先输入本课要学习的一个汉字。" };
  }

  if (characters.length !== 1) {
    return { valid: false, message: "一次只生成一个汉字的书写动画。" };
  }

  if (!CHINESE_CHARACTER.test(characters[0])) {
    return { valid: false, message: "请输入单个汉字，例如“春”或“学”。" };
  }

  return { valid: true, character: characters[0] };
}

export function filterSingleCharacter(value) {
  const firstChineseCharacter = Array.from(value).find((character) => CHINESE_CHARACTER.test(character));
  return firstChineseCharacter || "";
}
