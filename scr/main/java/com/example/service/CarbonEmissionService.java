package com.example.service;

import com.example.entity.CarbonEmissionRecord;
import java.util.List;


public interface CarbonEmissionService {
    CarbonEmissionRecord saveRecord(CarbonEmissionRecord record);
    List<CarbonEmissionRecord> listRecordsByUserId(Long userId);
    CarbonEmissionRecord updateRecord(CarbonEmissionRecord record);
}