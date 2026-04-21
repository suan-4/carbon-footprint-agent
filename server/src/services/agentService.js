const OpenAI = require('openai');
const env = require('../config/env');
const knowledgeService = require('./knowledgeService');

let client = null;

function getClient() {
  if (!env.openai.apiKey) {
    const error = new Error('未配置 OPENAI_API_KEY，无法调用 Agent 模型');
    error.statusCode = 500;
    throw error;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.openai.apiKey,
      baseURL: env.openai.baseUrl
    });
  }

  return client;
}

function buildSuggestions(message = '') {
  const text = String(message || '').trim();

  if (!text) {
    return ['今天为什么没加分？', '种子纸怎么兑换？', '教材互助怎么发布？'];
  }

  if (text.includes('积分') || text.includes('加分')) {
    return ['哪些行为可以加分？', '为什么今天没到账？', '商城兑换规则是什么？'];
  }

  if (text.includes('商城') || text.includes('兑换')) {
    return ['兑换后怎么查看订单？', '实体和虚拟权益有什么区别？', '库存什么时候更新？'];
  }

  if (text.includes('教材') || text.includes('互助') || text.includes('广场')) {
    return ['教材发布需要填什么？', '互助怎么匿名展示？', '认领后怎么联系？'];
  }

  if (text.includes('隐私') || text.includes('合规') || text.includes('数据')) {
    return ['会收集哪些数据？', '语音会不会上传？', '小程序审核要准备什么？'];
  }

  return ['先做哪个模块最合理？', 'RAG 需要哪些知识库？', '小程序上线前要准备什么？'];
}

function buildMessages(message, contextText) {
  return [
    {
      role: 'system',
      content:
        '你是“碳迹同行”项目里的校园低碳助手“小碳”。回答要使用简洁、自然、可信的中文。优先依据提供的项目知识片段回答积分规则、行为打卡、商城兑换、教材互助、隐私合规、校园低碳知识和微信小程序使用问题。不要编造不存在的功能、政策或数据；如果知识片段里没有明确答案，就直接说明“当前项目里还没有明确这项规则”或“这部分还未接入”，然后再给出稳妥建议。'
    },
    {
      role: 'system',
      content: `以下是从项目知识库中检索到的相关资料，请优先参考这些资料回答：\n\n${contextText}`
    },
    {
      role: 'user',
      content: String(message || '')
    }
  ];
}

async function chat(message) {
  const openai = getClient();
  const retrievedChunks = knowledgeService.retrieveRelevantChunks(message, { limit: 4 });
  const contextText = knowledgeService.formatChunksForPrompt(retrievedChunks);

  const completion = await openai.chat.completions.create({
    model: env.openai.model,
    messages: buildMessages(message, contextText)
  });

  const answer = completion.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    const error = new Error('模型返回了空结果');
    error.statusCode = 502;
    throw error;
  }

  return {
    answer,
    suggestions: buildSuggestions(message),
    references: retrievedChunks.map((chunk) => ({
      sourceFile: chunk.sourceFile,
      title: chunk.title,
      sectionPath: chunk.sectionPath
    }))
  };
}

module.exports = {
  chat
};
