const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

function loadKnowledgeService() {
  delete require.cache[require.resolve('../src/services/knowledgeService')];
  return require('../src/services/knowledgeService');
}

test('loadKnowledgeChunks reads markdown files from KNOWLEDGE_DIR when configured', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'carbon-knowledge-'));
  const filePath = path.join(tempDir, 'guide.md');
  const previousKnowledgeDir = process.env.KNOWLEDGE_DIR;

  fs.writeFileSync(filePath, '# 低碳指南\n校园出行优先步行和骑行。', 'utf8');
  process.env.KNOWLEDGE_DIR = tempDir;

  try {
    const knowledgeService = loadKnowledgeService();
    const chunks = knowledgeService.loadKnowledgeChunks();

    assert.ok(chunks.length > 0);
    assert.ok(chunks.some((chunk) => chunk.sourceFile === 'guide.md'));
  } finally {
    if (typeof previousKnowledgeDir === 'string') {
      process.env.KNOWLEDGE_DIR = previousKnowledgeDir;
    } else {
      delete process.env.KNOWLEDGE_DIR;
    }

    delete require.cache[require.resolve('../src/services/knowledgeService')];
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
