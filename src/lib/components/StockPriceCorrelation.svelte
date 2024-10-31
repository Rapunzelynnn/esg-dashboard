<script lang="ts">
import { fade } from 'svelte/transition';
import type { Company, PriceData } from '$lib/types';
import { Card } from '$lib/components/ui/card';

export let data: Company[] = [];
export let priceData: Record<string, PriceData[]> = {};
export let expanded = false;

interface ProcessedCompany extends Company {
  priceChange: number;
}

// State management
let selectedIndustries = new Set<string>();
let searchTerm = '';
let hoveredCompany: ProcessedCompany | null = null;
let selectedMetric: 'total' | 'environmental' | 'social' | 'governance' = 'total';
let yAxisScale = 'linear'; // 'linear' or 'log'

// Get unique industries and create color scale
$: industries = [...new Set(data.map(d => d.industryName))].sort();
$: colorScale = new Map(industries.map((industry, i) => 
  [industry, `hsl(${(i * 360) / industries.length}, 70%, 50%)`]
));

// Calculate price changes with proper date handling
function calculatePriceChange(prices: PriceData[]): number | null {
  if (!prices || prices.length < 2) return null;
  
  const sortedPrices = [...prices].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstPrice = sortedPrices[0].price;
  const lastPrice = sortedPrices[sortedPrices.length - 1].price;
  
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

// Process data for visualization with improved filtering
$: processedData = data
  .map(company => {
    const priceChange = priceData[company.symbol] 
      ? calculatePriceChange(priceData[company.symbol]) ?? 0
      : 0;
    return {
      ...company,
      priceChange
    };
  })
  .filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      company.fullName.toLowerCase().includes(searchLower) ||
      company.symbol.toLowerCase().includes(searchLower);
    const matchesIndustry = selectedIndustries.size === 0 || 
      selectedIndustries.has(company.industryName);
    return matchesSearch && matchesIndustry;
  }) as ProcessedCompany[];

// Calculate visualization scales
$: {
  const prices = processedData.map(d => d.priceChange);
  yMin = Math.floor(Math.min(...prices) / 10) * 10;
  yMax = Math.ceil(Math.max(...prices) / 10) * 10;
}
$: xMax = Math.max(...processedData.map(d => getSelectedEsgScore(d)));
$: yTicks = generateYAxisTicks(yMin, yMax);
let yMin = -100;
let yMax = 800;

// Generate appropriate Y-axis ticks
function generateYAxisTicks(min: number, max: number): number[] {
  const step = (max - min) / 8;
  return Array.from({ length: 9 }, (_, i) => min + step * i);
}

function getSelectedEsgScore(company: Company): number {
  switch (selectedMetric) {
    case 'environmental':
      return company.esgScores.environmental.score;
    case 'social':
      return company.esgScores.social.score;
    case 'governance':
      return company.esgScores.governance.score;
    default:
      return company.esgScores.total;
  }
}

function formatPriceChange(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function getPointColor(priceChange: number, industry: string): string {
  return colorScale.get(industry) || '#808080';
}

// Calculate point position
function getYPosition(value: number): string {
  if (yAxisScale === 'log' && value > 0) {
    return `${((Math.log10(value) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * 100}%`;
  }
  return `${((value - yMin) / (yMax - yMin)) * 100}%`;
}

// Calculate trend line
$: trendLineData = calculateTrendLine(processedData);

function calculateTrendLine(data: ProcessedCompany[]) {
  if (data.length < 2) return null;

  const xValues = data.map(d => getSelectedEsgScore(d));
  const yValues = data.map(d => d.priceChange);

  const n = data.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const correlation = calculateCorrelation(xValues, yValues);

  return { slope, intercept, correlation };
}

function calculateCorrelation(xValues: number[], yValues: number[]): number {
  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

  return (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
}
</script>

<div class="w-full space-y-4">
  <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
    <div class="space-y-2">
      <h2 class="text-xl font-semibold">ESG Score vs Stock Price Performance</h2>
      <p class="text-sm text-gray-600">
        Correlation between {selectedMetric} ESG score and stock price change
      </p>
    </div>
    
    <div class="flex flex-col sm:flex-row gap-2">
      <select
        bind:value={selectedMetric}
        class="px-3 py-1 border rounded-lg bg-white"
      >
        <option value="total">Total ESG Score</option>
        <option value="environmental">Environmental Score</option>
        <option value="social">Social Score</option>
        <option value="governance">Governance Score</option>
      </select>
      
      <select
        bind:value={yAxisScale}
        class="px-3 py-1 border rounded-lg bg-white"
      >
        <option value="linear">Linear Scale</option>
        <option value="log">Log Scale</option>
      </select>
      
      <input
        type="text"
        bind:value={searchTerm}
        placeholder="Search companies..."
        class="px-3 py-1 border rounded-lg"
      />
    </div>
  </div>

  <!-- Industry Filters -->
  <div class="flex flex-wrap gap-2">
    {#each industries as industry}
      <button
        class="px-3 py-1 text-sm rounded-full transition-all duration-200
          {selectedIndustries.has(industry) ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'}"
        on:click={() => {
          selectedIndustries = new Set(selectedIndustries);
          if (selectedIndustries.has(industry)) {
            selectedIndustries.delete(industry);
          } else {
            selectedIndustries.add(industry);
          }
        }}
      >
        <div class="flex items-center space-x-2">
          <div
            class="w-2 h-2 rounded-full"
            style="background-color: {colorScale.get(industry)}"
          ></div>
          <span>{industry}</span>
        </div>
      </button>
    {/each}
  </div>

  <!-- Chart Area -->
  <div class="relative" style="height: {expanded ? 600 : 400}px;">
    <div class="absolute inset-0">
      <!-- Axes and Grid -->
      <div class="absolute inset-x-16 inset-y-8 border-l border-b border-gray-200">
        <!-- Y-axis ticks -->
        {#each yTicks as tick}
          <div
            class="absolute left-0 w-full h-0 flex items-center"
            style="bottom: {getYPosition(tick)}"
          >
            <div class="absolute -left-14 text-xs text-gray-600 w-12 text-right">
              {formatPriceChange(tick)}
            </div>
            <div class="w-full border-t border-gray-100" />
          </div>
        {/each}

        <!-- X-axis ticks -->
        {#each [0, 20, 40, 60, 80, 100] as tick}
          <div
            class="absolute bottom-0 h-full w-0 flex justify-center"
            style="left: {tick}%"
          >
            <div class="absolute -bottom-6 text-xs text-gray-600 transform -translate-x-1/2">
              {tick}
            </div>
            <div class="h-full border-l border-gray-100" />
          </div>
        {/each}

        <!-- Trend line -->
        {#if trendLineData}
          <div
            class="absolute w-full h-0 border-t-2 border-gray-400 border-dashed"
            style="
              bottom: {getYPosition(trendLineData.intercept)}%;
              transform: rotate({Math.atan(trendLineData.slope) * (180 / Math.PI)}deg);
              transform-origin: left bottom;
            "
          ></div>
        {/if}

        <!-- Data points -->
        {#each processedData as company}
          {@const esgScore = getSelectedEsgScore(company)}
          <button
            class="absolute rounded-full transition-all duration-200"
            style="
              left: {(esgScore / xMax) * 100}%;
              bottom: {getYPosition(company.priceChange)};
              width: {expanded ? '8px' : '6px'};
              height: {expanded ? '8px' : '6px'};
              background-color: {getPointColor(company.priceChange, company.industryName)};
              transform: translate(-50%, -50%);
              opacity: 0.7;
            "
            on:mouseenter={() => hoveredCompany = company}
            on:mouseleave={() => hoveredCompany = null}
          >
            {#if hoveredCompany === company}
              <div
                class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                  bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72
                  text-left pointer-events-none z-10"
                transition:fade
              >
                <div class="font-bold">{company.fullName}</div>
                <div class="text-sm text-gray-500">({company.symbol})</div>
                <div class="text-sm text-gray-600">{company.industryName}</div>
                <div class="mt-2 space-y-1">
                  <div>ESG Score: <span class="font-semibold">
                    {esgScore.toFixed(1)}</span>
                  </div>
                  <div>Price Change: <span class="font-semibold">
                    {formatPriceChange(company.priceChange)}</span>
                  </div>
                  <div>Market Cap: <span class="font-semibold">
                    ${(company.marketCap).toFixed(1)}B</span>
                  </div>
                  <div>Beta: <span class="font-semibold">
                    {company.beta.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Axis Labels -->
      <div class="absolute bottom-0 left-0 right-0 text-center text-sm text-gray-600 font-medium">
        {selectedMetric === 'total' ? 'ESG Score' : `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Score`}
      </div>
      <div class="absolute left-2 top-1/2 -rotate-90 text-sm text-gray-600 font-medium whitespace-nowrap">
        Price Change (%)
      </div>
    </div>
  </div>

  <!-- Statistics Panel -->
  {#if processedData.length > 0}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Companies Shown</div>
        <div class="font-semibold">{processedData.length}</div>
      </div>
      {#if trendLineData}
        <div class="bg-gray-50 p-3 rounded-lg">
          <div class="text-gray-600">Correlation</div>
          <div class="font-semibold">{trendLineData.correlation.toFixed(3)}</div>
        </div>
      {/if}
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Average Price Change</div>
        <div class="font-semibold">
          {formatPriceChange(processedData.reduce((sum, co) => sum + co.priceChange, 0) / 
            processedData.length)}
        </div>
      </div>
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="text-gray-600">Average ESG Score</div>
        <div class="font-semibold">
          {(processedData.reduce((sum, co) => sum + getSelectedEsgScore(co), 0) / 
            processedData.length).toFixed(1)}
        </div>
      </div>
    </div>
  {/if}
</div>