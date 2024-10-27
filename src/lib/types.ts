export interface ESGData {
	symbol: string;
	fullName: string;
	gicsSector: string;
	gicsSubIndustry: string;
	industry_code: string;
	industry_name: string;
	data_availability: string;
	location: string;
	total_esg_score: number;
	environmental_score: number;
	environmental_mean: number;
	environmental_max: number;
	social_score: number;
	social_mean: number;
	social_max: number;
	governance_score: number;
	governance_mean: number;
	governance_max: number;
	percentile: number;
	ratingYear: number;
	ratingMonth: number;
	marketCap: number;
	beta: number;
	overallRisk: number;
	processed: boolean;
}
export interface Company {
	symbol: string;
	fullName: string;
	industryCode: string;
	industryName: string;
	location: string;
	marketCap: number;
	beta: number;
	esgScores: {
		total: number;
		environmental: {
			score: number;
			mean: number;
			max: number;
		};
		social: {
			score: number;
			mean: number;
			max: number;
		};
		governance: {
			score: number;
			mean: number;
			max: number;
		};
		percentile: number;
		ratingYear: number;
		ratingMonth: number;
	};
}

export interface FilterState {
	timeRange: [Date, Date];
	selectedSectors: string[];
	selectedIndustries: string[];
	selectedCompanies: string[];
	locationFilter: string[];
	esgScoreRange: [number, number];
	dataAvailabilityFilter: string[];
	sortBy: keyof Pick<
		ESGData,
		| 'total_esg_score'
		| 'environmental_score'
		| 'social_score'
		| 'governance_score'
		| 'marketCap'
		| 'percentile'
	>;
	sortDirection: 'asc' | 'desc';
}
export interface PriceData {
	date: Date;
	[symbol: string]: Date | number; // Allow both Date for the date field and number for stock prices
}
