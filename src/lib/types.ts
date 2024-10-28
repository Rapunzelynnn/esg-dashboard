// $lib/types.ts
import type { 
    ChartData, 
    ChartOptions,
    Scale,
    LinearScaleOptions as ChartLinearScaleOptions,
    TimeScaleOptions as ChartTimeScaleOptions,
    CoreScaleOptions,
    Tick,
    TickOptions,
    TimeScaleTimeOptions
} from 'chart.js';

// Remove Recharts declarations since we're using Chart.js
// Keep your existing interfaces
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
    timeRange: Date[];
    selectedSectors: string[];
    selectedIndustries: string[];
    selectedCompanies: string[];
    locationFilter: string[];
    esgScoreRange: number[];
    dataAvailabilityFilter: string[];
    sortBy: string;
    sortDirection: string;
}

// Updated interfaces for price data
export interface PriceDataPoint {
    date: Date;
    price: number;
}

export interface PriceData {
    date: string;
    price: number;
}

// New interfaces for Chart.js
export interface StockChartData {
    datasets: Array<{
        label: string;
        data: Array<{ x: Date; y: number }>;
        borderColor: string;
        backgroundColor: string;
        fill: boolean;
        tension: number;
        borderWidth: number;
        pointRadius: number;
        pointHoverRadius: number;
    }>;
}
// Define custom tick options
interface CustomTickOptions extends Partial<TickOptions> {
    font?: {
        size: number;
    };
    color?: string;
    maxRotation?: number;
    minRotation?: number;
    callback?: (this: Scale<CoreScaleOptions>, tickValue: string | number, index: number, ticks: Tick[]) => string;
}

interface CustomTimeScaleOptions extends Omit<Partial<ChartTimeScaleOptions>, 'ticks' | 'time'> {
    type: 'time';
    grid?: {
        borderColor?: string;
        display?: boolean;
    };
    ticks?: CustomTickOptions;
    time?: Partial<TimeScaleTimeOptions>;
}

interface CustomLinearScaleOptions extends Omit<Partial<ChartLinearScaleOptions>, 'ticks'> {
    type: 'linear';
    grid?: {
        borderColor?: string;
        display?: boolean;
    };
    ticks?: CustomTickOptions;
    position?: 'left' | 'right';
}


// Define the chart options interface
export interface StockChartOptions extends Omit<ChartOptions<'line'>, 'scales'> {
    responsive: boolean;
    maintainAspectRatio: boolean;
    interaction: {
        mode: 'index';
        intersect: boolean;
    };
    scales: {
        x: CustomTimeScaleOptions;
        y: CustomLinearScaleOptions;
    };
    plugins: {
        tooltip: {
            enabled: boolean;
            mode: 'index';
            intersect: boolean;
            backgroundColor: string;
            titleColor: string;
            bodyColor: string;
            borderColor: string;
            borderWidth: number;
            padding: number;
            cornerRadius: number;
            displayColors: boolean;
            callbacks: {
                label: (context: any) => string;
            };
        };
        legend: {
            display: boolean;
        };
    };
}