// src/lib/charts/colors.ts
// Shared industry color data — extracted from MarketCapCorrelation, ScoreComparison, StockPriceCorrelation

export const categoryOrder = [
  'Information Technology', 'Communication Services', 'Financials',
  'Industrials', 'Consumer Discretionary', 'Consumer Staples',
  'Health Care', 'Energy', 'Materials', 'Utilities'
] as const;

export type CategoryName = typeof categoryOrder[number];

export const industryCategories: Record<string, { base: string; industries: { name: string; shade: string }[] }> = {
  'Information Technology': { base: '#2563EB', industries: [
    { name: 'Software', shade: '#2563EB' },
    { name: 'IT Services', shade: '#1D4ED8' },
    { name: 'Computers & Peripherals and Office Electronics', shade: '#1E40AF' },
    { name: 'Semiconductors & Semiconductor Equipment', shade: '#3B82F6' },
    { name: 'Communications Equipment', shade: '#60A5FA' },
    { name: 'Electronic Equipment, Instruments & Components', shade: '#2563EB' }
  ]},
  'Communication Services': { base: '#EA580C', industries: [
    { name: 'Interactive Media, Services & Home Entertainment', shade: '#EA580C' },
    { name: 'Media, Movies & Entertainment', shade: '#C2410C' },
    { name: 'Telecommunication Services', shade: '#9A3412' }
  ]},
  'Financials': { base: '#059669', industries: [
    { name: 'Banks', shade: '#059669' },
    { name: 'Diversified Financial Services and Capital Markets', shade: '#047857' },
    { name: 'Insurance', shade: '#065F46' },
    { name: 'Real Estate Management & Development', shade: '#10B981' },
    { name: 'Equity Real Estate Investment Trusts (REITs)', shade: '#34D399' }
  ]},
  'Industrials': { base: '#DC2626', industries: [
    { name: 'Aerospace & Defense', shade: '#DC2626' },
    { name: 'Airlines', shade: '#B91C1C' },
    { name: 'Building Products', shade: '#991B1B' },
    { name: 'Machinery and Electrical Equipment', shade: '#EF4444' },
    { name: 'Electrical Components & Equipment', shade: '#F87171' },
    { name: 'Trading Companies & Distributors', shade: '#DC2626' },
    { name: 'Professional Services', shade: '#B91C1C' },
    { name: 'Commercial Services & Supplies', shade: '#991B1B' },
    { name: 'Construction & Engineering', shade: '#EF4444' },
    { name: 'Transportation and Transportation Infrastructure', shade: '#F87171' },
    { name: 'Auto Components', shade: '#DC2626' }
  ]},
  'Consumer Discretionary': { base: '#D97706', industries: [
    { name: 'Automobiles', shade: '#D97706' },
    { name: 'Retailing', shade: '#B45309' },
    { name: 'Restaurants & Leisure Facilities', shade: '#92400E' },
    { name: 'Hotels, Resorts & Cruise Lines', shade: '#F59E0B' },
    { name: 'Leisure Equipment & Products and Consumer Electronics', shade: '#FBBF24' },
    { name: 'Homebuilding', shade: '#D97706' },
    { name: 'Textiles, Apparel & Luxury Goods', shade: '#B45309' },
    { name: 'Casinos & Gaming', shade: '#92400E' },
    { name: 'Household Durables', shade: '#F59E0B' }
  ]},
  'Consumer Staples': { base: '#DB2777', industries: [
    { name: 'Food Products', shade: '#DB2777' },
    { name: 'Food & Staples Retailing', shade: '#BE185D' },
    { name: 'Household Products', shade: '#9D174D' },
    { name: 'Personal Products', shade: '#EC4899' },
    { name: 'Beverages', shade: '#F472B6' },
    { name: 'Tobacco', shade: '#DB2777' }
  ]},
  'Health Care': { base: '#0284C7', industries: [
    { name: 'Biotechnology', shade: '#0284C7' },
    { name: 'Pharmaceuticals', shade: '#0369A1' },
    { name: 'Health Care Equipment & Supplies', shade: '#075985' },
    { name: 'Health Care Providers & Services', shade: '#0EA5E9' },
    { name: 'Life Sciences Tools & Services', shade: '#38BDF8' }
  ]},
  'Energy': { base: '#0D9488', industries: [
    { name: 'Oil & Gas Upstream & Integrated', shade: '#0D9488' },
    { name: 'Oil & Gas Storage & Transportation', shade: '#0F766E' },
    { name: 'Oil & Gas Refining & Marketing', shade: '#115E59' },
    { name: 'Energy Equipment & Services', shade: '#14B8A6' }
  ]},
  'Materials': { base: '#65A30D', industries: [
    { name: 'Chemicals', shade: '#65A30D' },
    { name: 'Construction Materials', shade: '#4D7C0F' },
    { name: 'Metals & Mining', shade: '#3F6212' },
    { name: 'Containers & Packaging', shade: '#84CC16' },
    { name: 'Steel', shade: '#A3E635' }
  ]},
  'Utilities': { base: '#CA8A04', industries: [
    { name: 'Electric Utilities', shade: '#CA8A04' },
    { name: 'Gas Utilities', shade: '#A16207' },
    { name: 'Multi and Water Utilities', shade: '#854D0E' }
  ]}
};

export function getIndustryColor(industryName: string): string {
  for (const cat of Object.values(industryCategories)) {
    const found = cat.industries.find(i => i.name === industryName);
    if (found) return found.shade;
  }
  return '#94A3B8';
}
