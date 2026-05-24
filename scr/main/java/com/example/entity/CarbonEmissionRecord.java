package com.example.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;


public class CarbonEmissionRecord {
    private Long id;
    private Long userId;
    private LocalDateTime recordTime;

    // 出行数据
    private String transportMode;
    private BigDecimal transportDistance;

    // 用电数据
    private BigDecimal monthlyElectricityUsage;

    // 饮食数据
    private BigDecimal dailyMeatConsumption;
    private BigDecimal dailyVegetableConsumption;

    private String remark;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    public CarbonEmissionRecord() {}

    public CarbonEmissionRecord(Long userId, String transportMode, BigDecimal transportDistance,
                                BigDecimal monthlyElectricityUsage, BigDecimal dailyMeatConsumption,
                                BigDecimal dailyVegetableConsumption, String remark) {
        this.userId = userId;
        this.recordTime = LocalDateTime.now();
        this.transportMode = transportMode;
        this.transportDistance = transportDistance;
        this.monthlyElectricityUsage = monthlyElectricityUsage;
        this.dailyMeatConsumption = dailyMeatConsumption;
        this.dailyVegetableConsumption = dailyVegetableConsumption;
        this.remark = remark;
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
    }

    // Getter & Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDateTime getRecordTime() { return recordTime; }
    public void setRecordTime(LocalDateTime recordTime) { this.recordTime = recordTime; }

    public String getTransportMode() { return transportMode; }
    public void setTransportMode(String transportMode) { this.transportMode = transportMode; }

    public BigDecimal getTransportDistance() { return transportDistance; }
    public void setTransportDistance(BigDecimal transportDistance) { this.transportDistance = transportDistance; }

    public BigDecimal getMonthlyElectricityUsage() { return monthlyElectricityUsage; }
    public void setMonthlyElectricityUsage(BigDecimal monthlyElectricityUsage) { this.monthlyElectricityUsage = monthlyElectricityUsage; }

    public BigDecimal getDailyMeatConsumption() { return dailyMeatConsumption; }
    public void setDailyMeatConsumption(BigDecimal dailyMeatConsumption) { this.dailyMeatConsumption = dailyMeatConsumption; }

    public BigDecimal getDailyVegetableConsumption() { return dailyVegetableConsumption; }
    public void setDailyVegetableConsumption(BigDecimal dailyVegetableConsumption) { this.dailyVegetableConsumption = dailyVegetableConsumption; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }

    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }

    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
}