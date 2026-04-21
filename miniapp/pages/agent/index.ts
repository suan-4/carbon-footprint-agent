import { request } from '../../utils/request';

type AgentChatResponse = {
  answer: string;
  suggestions: string[];
};

const welcomeSuggestions = [
  '怎么领种子纸？',
  '为什么今天没有加分？',
  '教材发布后如何匹配？',
  '积分商城的兑换规则是什么？'
];

Page({
  data: {
    inputValue: '',
    sending: false,
    scrollIntoView: '',
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        text: '你好，我是小碳。你可以直接问我积分规则、行为打卡、教材互助、商城兑换和隐私合规。',
        suggestions: welcomeSuggestions
      }
    ]
  },

  onLoad() {
    this.scrollToMessage('welcome');
  },

  scrollToMessage(id: string) {
    this.setData({
      scrollIntoView: `msg-${id}`
    });
  },

  onInputChange(event: WechatMiniprogram.CustomEvent) {
    this.setData({
      inputValue: event.detail.value
    });
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: '/pages/home/index' });
      }
    });
  },

  tapSuggestion(event: WechatMiniprogram.BaseEvent) {
    const { value } = event.currentTarget.dataset as { value: string };
    this.sendMessage(value);
  },

  sendFromInput() {
    this.sendMessage((this.data as any).inputValue);
  },

  async sendMessage(rawMessage: string) {
    const message = String(rawMessage || '').trim();
    if (!message || (this.data as any).sending) return;

    const now = Date.now();
    const userMessage = {
      id: `user-${now}`,
      role: 'user',
      text: message
    };
    const assistantMessageId = `assistant-${now}`;
    const pendingMessage = {
      id: assistantMessageId,
      role: 'assistant',
      text: '小碳正在整理回答...',
      loading: true,
      suggestions: []
    };

    this.setData(
      {
        inputValue: '',
        sending: true,
        messages: [...(this.data as any).messages, userMessage, pendingMessage]
      },
      () => {
        this.scrollToMessage(assistantMessageId);
      }
    );

    try {
      const result = await request<AgentChatResponse>({
        url: '/agent/chat',
        method: 'POST',
        data: { message }
      });

      const nextMessages = (this.data as any).messages.map((item: any) => {
        if (item.id !== assistantMessageId) return item;
        return {
          id: assistantMessageId,
          role: 'assistant',
          text: result.answer,
          loading: false,
          suggestions: result.suggestions || []
        };
      });

      this.setData({ messages: nextMessages }, () => {
        this.scrollToMessage(assistantMessageId);
      });
    } catch (error) {
      const nextMessages = (this.data as any).messages.map((item: any) => {
        if (item.id !== assistantMessageId) return item;
        return {
          id: assistantMessageId,
          role: 'assistant',
          text: '这一条消息暂时没有成功发出去。你可以再试一次，或者先问我积分、商城、教材互助这几类问题。',
          loading: false,
          suggestions: ['为什么今天没有加分？', '积分商城怎么兑换？']
        };
      });

      this.setData({ messages: nextMessages });
      console.error(error);
    } finally {
      this.setData({ sending: false });
    }
  }
});
