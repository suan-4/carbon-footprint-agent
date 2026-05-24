// server/api/advice.js
import { getMatchingAdvices } from '../services/adviceService';

export default async function handler(req, res) {
  try {
    // 假设前端会把用户的碳排放数据传过来
    const userEmissions = req.body; // 例如 { transport: 60, diet: 30, energy: 10 }

    // 调用服务层获取建议
    const advices = getMatchingAdvices(userEmissions);

    // 返回结果给前端
    res.status(200).json({ success: true, data: advices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
