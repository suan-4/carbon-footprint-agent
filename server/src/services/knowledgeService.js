const fs = require('fs');
const path = require('path');

function getKnowledgeDirCandidates() {
  return [
    process.env.KNOWLEDGE_DIR,
    path.resolve(process.cwd(), 'knowledge'),
    path.resolve(__dirname, '../../knowledge'),
    path.resolve(__dirname, '../../..', 'knowledge')
  ]
    .filter(Boolean)
    .map((candidatePath) => path.resolve(candidatePath))
    .filter((candidatePath, index, list) => list.indexOf(candidatePath) === index);
}

function resolveKnowledgeDir() {
  return getKnowledgeDirCandidates().find((candidatePath) => fs.existsSync(candidatePath)) || null;
}

let cachedSignature = '';
let cachedChunks = [];

function getMarkdownFiles() {
  const knowledgeDir = resolveKnowledgeDir();

  if (!knowledgeDir) {
    return [];
  }

  return fs
    .readdirSync(knowledgeDir)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => path.join(knowledgeDir, fileName));
}

function buildSignature(filePaths) {
  return filePaths
    .map((filePath) => {
      const stat = fs.statSync(filePath);
      return `${filePath}:${stat.size}:${stat.mtimeMs}`;
    })
    .join('|');
}

function cleanHeadingText(text = '') {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function buildDefaultChunk(fileName) {
  const title = path.basename(fileName, '.md');
  return {
    title,
    path: [title],
    lines: []
  };
}

function parseMarkdownToChunks(filePath) {
  const fileName = path.basename(filePath);
  const sourceType = path.basename(filePath, '.md');
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  const chunks = [];

  let headingStack = [];
  let currentChunk = null;

  const pushCurrentChunk = () => {
    if (!currentChunk) return;

    const content = currentChunk.lines.join('\n').trim();
    if (!content) return;

    const sectionPath = currentChunk.path.filter(Boolean);
    const title = currentChunk.title || sourceType;

    chunks.push({
      id: `${sourceType}:${sectionPath.join('>') || title}`,
      sourceFile: fileName,
      sourceType,
      title,
      sectionPath,
      content,
      text: `${sectionPath.join(' / ')}\n${content}`.trim()
    });
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);

    if (headingMatch) {
      pushCurrentChunk();

      const level = headingMatch[1].length;
      const title = cleanHeadingText(headingMatch[2]);

      headingStack = headingStack.slice(0, level - 1);
      headingStack[level - 1] = title;

      currentChunk = {
        title,
        path: [...headingStack],
        lines: []
      };
      return;
    }

    if (!currentChunk) {
      currentChunk = buildDefaultChunk(fileName);
    }

    currentChunk.lines.push(line);
  });

  pushCurrentChunk();

  if (!chunks.length && raw.trim()) {
    const fallbackChunk = buildDefaultChunk(fileName);
    fallbackChunk.lines = lines;
    currentChunk = fallbackChunk;
    pushCurrentChunk();
  }

  return chunks;
}

function loadKnowledgeChunks() {
  const filePaths = getMarkdownFiles();
  const signature = buildSignature(filePaths);

  if (signature && signature === cachedSignature) {
    return cachedChunks;
  }

  cachedSignature = signature;
  cachedChunks = filePaths.flatMap((filePath) => parseMarkdownToChunks(filePath));
  return cachedChunks;
}

function extractLatinTokens(text = '') {
  return (String(text || '').toLowerCase().match(/[a-z0-9_]+/g) || []).filter((token) => token.length >= 2);
}

function extractCjkTokens(text = '') {
  const chars = (String(text || '').match(/[\u4e00-\u9fff]/g) || []).filter(Boolean);
  const tokens = [];

  for (let index = 0; index < chars.length; index += 1) {
    if (chars[index + 1]) {
      tokens.push(chars[index] + chars[index + 1]);
    }
    if (chars[index + 2]) {
      tokens.push(chars[index] + chars[index + 1] + chars[index + 2]);
    }
  }

  return tokens;
}

function normalizeText(text = '') {
  return String(text || '').toLowerCase();
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;

  let count = 0;
  let startIndex = 0;

  while (startIndex < haystack.length) {
    const foundIndex = haystack.indexOf(needle, startIndex);
    if (foundIndex === -1) break;
    count += 1;
    startIndex = foundIndex + needle.length;
  }

  return count;
}

function buildQueryTokens(query = '') {
  const rawQuery = String(query || '').trim();
  const tokens = new Set([
    ...extractLatinTokens(rawQuery),
    ...extractCjkTokens(rawQuery)
  ]);

  if (rawQuery.length >= 2) {
    tokens.add(normalizeText(rawQuery));
  }

  return [...tokens].filter(Boolean);
}

function scoreChunk(chunk, query, tokens) {
  const normalizedTitle = normalizeText(`${chunk.title} ${chunk.sectionPath.join(' ')}`);
  const normalizedContent = normalizeText(chunk.content);
  const normalizedText = normalizeText(chunk.text);
  const normalizedQuery = normalizeText(query);

  let score = 0;

  tokens.forEach((token) => {
    const titleHits = countOccurrences(normalizedTitle, token);
    const contentHits = countOccurrences(normalizedContent, token);

    score += titleHits * 6;
    score += contentHits * 2;
  });

  if (normalizedQuery && normalizedText.includes(normalizedQuery)) {
    score += 12;
  }

  return score;
}

function retrieveRelevantChunks(query, options = {}) {
  const limit = Number(options.limit || 4);
  const chunks = loadKnowledgeChunks();
  const tokens = buildQueryTokens(query);

  if (!chunks.length || !tokens.length) {
    return [];
  }

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk, query, tokens)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function formatChunksForPrompt(chunks) {
  if (!chunks.length) {
    return '当前没有命中的项目知识片段。';
  }

  return chunks
    .map((chunk, index) => {
      return [
        `资料 ${index + 1}`,
        `来源文件：${chunk.sourceFile}`,
        `分类：${chunk.sourceType}`,
        `标题：${chunk.title}`,
        `层级：${chunk.sectionPath.join(' > ') || chunk.title}`,
        `内容：${chunk.content}`
      ].join('\n');
    })
    .join('\n\n');
}

module.exports = {
  loadKnowledgeChunks,
  retrieveRelevantChunks,
  formatChunksForPrompt,
  resolveKnowledgeDir
};
