<!-- $lib/routes/analysis/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { loadCompanyData, companies } from '$lib/stores';
  import { Card } from '$lib/components/ui/card';
  import ESGIndustryAnalysis from '$lib/components/ESGIndustryAnalysis.svelte';
  import MarketCapCorrelation from '$lib/components/MarketCapCorrelation.svelte';
  import ScoreComparison from '$lib/components/ScoreComparison.svelte';
  import StockPriceCorrelation from '$lib/components/StockPriceCorrelation.svelte';
  import type { Company, PriceData } from '$lib/types';

  let loading = true;
  let processedPriceData: Record<string, PriceData[]> = {};
  let activeChart = 0; // Track which chart is currently displayed

  const charts = [
    { id: 0, title: 'ESG Score Breakdown by Industry', icon: '📊' },
    { id: 1, title: 'ESG Score vs Market Cap', icon: '💰' },
    { id: 2, title: 'ESG Score Comparison', icon: '📈' },
    { id: 3, title: 'ESG vs. Stock Price', icon: '📉' }
  ];

  async function loadPriceData() {
    try {
      const response = await fetch('/processed_sp500_price_data.csv');
      const csvData = await response.text();
      
      const [headerRow, ...dataRows] = csvData.split('\n');
      const symbols = headerRow.split(',').slice(1);
      
      dataRows.forEach(row => {
        if (!row.trim()) return;
        
        const [date, ...prices] = row.split(',');
        prices.forEach((price, index) => {
          const symbol = symbols[index];
          if (!symbol || !price) return;
          
          if (!processedPriceData[symbol]) {
            processedPriceData[symbol] = [];
          }
          
          const numPrice = parseFloat(price);
          if (!isNaN(numPrice)) {
            processedPriceData[symbol].push({
              date,
              price: numPrice
            });
          }
        });
      });
    } catch (error) {
      console.error('Error loading price data:', error);
    }
  }

  onMount(async () => {
    try {
      await Promise.all([
        loadCompanyData(),
        loadPriceData()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  });
</script>

<div class="max-w-[95%] mx-auto">
  <!-- Reserved space for Company Profile -->
  <div class="mb-8 bg-white rounded-lg shadow-sm p-6 min-h-[200px]">
    <p class="text-gray-400 text-center">Company Profile Section (Coming Soon)</p>
  </div>

  <!-- Analysis Section -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold mb-4 text-gray-800">Overall Analysis</h1>
    
    <!-- Chart Navigation -->
    <div class="flex space-x-2 mb-6 overflow-x-auto pb-2">
      {#each charts as chart}
        <button
          class="px-4 py-2 rounded-lg flex items-center space-x-2 whitespace-nowrap
                 {activeChart === chart.id ? 
                   'bg-blue-500 text-white' : 
                   'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
          on:click={() => activeChart = chart.id}
        >
          <span>{chart.icon}</span>
          <span>{chart.title}</span>
        </button>
      {/each}
    </div>

    {#if loading}
      <div class="flex justify-center items-center h-64">
        <div class="text-gray-600">Loading data...</div>
      </div>
    {:else if $companies.length > 0}
      <Card class="min-h-[600px] p-8">
        {#if activeChart === 0}
          <ESGIndustryAnalysis data={$companies} expanded={true} />
        {:else if activeChart === 1}
          <MarketCapCorrelation data={$companies} expanded={true} />
        {:else if activeChart === 2}
          <ScoreComparison data={$companies} expanded={true} />
        {:else if activeChart === 3}
          <StockPriceCorrelation 
            data={$companies} 
            priceData={processedPriceData}
            expanded={true} 
          />
        {/if}
      </Card>
    {:else}
      <div class="text-center p-4">
        <p class="text-gray-600">No company data available</p>
      </div>
    {/if}
  </div>
</div>