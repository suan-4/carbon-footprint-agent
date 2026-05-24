package com.example.service;

import com.example.entity.CarbonEmissionRecord;
import java.util.List;

/**
 * 碳排放数据录入服务接口
 */
public interface CarbonEmissionService {
    CarbonEmissionRecord saveRecord(CarbonEmissionRecord record);
    List<CarbonEmissionRecord> listRecordsByUserId(Long userId);
    CarbonEmissionRecord updateRecord(CarbonEmissionRecord record);
}