// src/lib/utils/dataLoader.ts

import type { ESGData, RawESGData, PriceData } from '../types';

export function processESGData(data: RawESGData[]): ESGData[] {
  return data.map((row: RawESGData) => ({
    symbol: row.Symbol,
    fullName: row.fullName || '',
    industry_code: row.industry_code || '',
    industry_name: row.industry_name || '',
    data_availability: row.data_availability || '',
    location: row.location || '',
    total_esg_score: Number(row.total_esg_score) || 0,
    environmental_score: Number(row.environmental_score) || 0,
    environmental_mean: Number(row.environmental_mean) || 0,
    gicsSector: row.gicsSector || '',
    gicsSubIndustry: row.gicsSubIndustry || '',
    processed: true
  }));
}

export function processPriceData(rawData: any[]): PriceData[] {
  return rawData.map(row => {
    const baseObject: PriceData = {
      date: row.Date,  // Keep as string instead of Date object
    };

    Object.entries(row).forEach(([key, value]) => {
      if (key !== 'Date') {
        baseObject[key] = Number(value);
      }
    });

    return baseObject;
  });
}