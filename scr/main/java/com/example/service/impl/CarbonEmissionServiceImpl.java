package com.example.service.impl;

import com.example.entity.CarbonEmissionRecord;
import com.example.service.CarbonEmissionService;
import com.example.util.CarbonDataValidator;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 碳排放数据录入服务实现
 */
public class CarbonEmissionServiceImpl implements CarbonEmissionService {

    private final Map<Long, CarbonEmissionRecord> recordStorage = new HashMap<>();
    private Long idSequence = 1L;

    @Override
    public CarbonEmissionRecord saveRecord(CarbonEmissionRecord record) {
        CarbonDataValidator.validate(record);
        record.setId(idSequence++);
        record.setRecordTime(LocalDateTime.now());
        record.setCreateTime(LocalDateTime.now());
        record.setUpdateTime(LocalDateTime.now());
        recordStorage.put(record.getId(), record);
        return record;
    }

    @Override
    public List<CarbonEmissionRecord> listRecordsByUserId(Long userId) {
        List<CarbonEmissionRecord> result = new ArrayList<>();
        for (CarbonEmissionRecord record : recordStorage.values()) {
            if (record.getUserId().equals(userId)) {
                result.add(record);
            }
        }
        return result;
    }

    @Override
    public CarbonEmissionRecord updateRecord(CarbonEmissionRecord record) {
        CarbonDataValidator.validate(record);
        if (!recordStorage.containsKey(record.getId())) {
            throw new IllegalArgumentException("碳排放记录不存在，无法更新");
        }
        record.setUpdateTime(LocalDateTime.now());
        recordStorage.put(record.getId(), record);
        return record;
    }
}