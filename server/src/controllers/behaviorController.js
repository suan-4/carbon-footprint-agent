const appDataService = require('../services/appDataService');

exports.getBehaviorCatalog = async (req, res, next) => {
  try {
    const catalog = await appDataService.getBehaviorCatalog();

    res.json({
      code: 0,
      message: 'success',
      data: catalog
    });
  } catch (error) {
    next(error);
  }
};

exports.createBehaviorRecord = async (req, res, next) => {
  try {
    const { behaviorCode, behaviorName, description } = req.body || {};

    // 1. 【新增】检查 behaviorCode，如果没有，用 behaviorName 作为默认类别
    if (!behaviorCode && !behaviorName) {
      res.status(400).json({
        code: 400,
        message: 'behaviorCode 或 behaviorName 必填',
        data: null
      });
      return;
    }

    // 2. 【新增】智能整理：如果 behaviorCode 为空，用 behaviorName 生成一个简单的 code
    const finalBehaviorCode = behaviorCode || behaviorName.trim().toLowerCase().replace(/\s+/g, '-');

    // 3. 【新增】给 description 加点默认值，避免空值
    const finalDescription = description || `${behaviorName} 的低碳行为记录`;

    // 4. 【核心】调用 service 层，传入整理后的数据
    const result = await appDataService.submitBehavior(
      {
        behaviorCode: finalBehaviorCode,   // 整理后的类别代码
        behaviorName,                      // 原始名称
        description: finalDescription      // 整理后的描述
      },
      req.authUser
    );

    res.json({
      code: 0,
      message: '记录成功',
      data: result
    });

  } catch (error) {
    next(error);
  }
};