<!-- $lib/routes/analysis/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { loadCompanyData, companies } from '$lib/stores';
  import { Card } from '$lib/components/ui/card';
  import CompanySearch from '$lib/components/CompanySearch.svelte';
  import CompanyProfile from '$lib/components/CompanyProfile.svelte';
  import ESGIndustryAnalysis from '$lib/components/ESGIndustryAnalysis.svelte';
  import MarketCapCorrelation from '$lib/components/MarketCapCorrelation.svelte';
  import ScoreComparison from '$lib/components/ScoreComparison.svelte';
  import StockPriceCorrelation from '$lib/components/StockPriceCorrelation.svelte';
  import type { Company, PriceData } from '$lib/types';

  let loading = true;
  let processedPriceData: Record<string, PriceData[]> = {};
  let activeChart = 0;

  const charts = [
    { id: 0, title: 'Industrial Score Breakdown', icon: '📊' },
    { id: 1, title: 'ESG vs Market Cap', icon: '💰' },
    { id: 2, title: 'Score Comparison', icon: '📈' },
    { id: 3, title: 'ESG vs Stock Price', icon: '📉' }
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

<div class="h-screen flex flex-col p-4 overflow-hidden">
  <!-- Company Profile Section - Fixed height -->
  <div class="h-[35vh]">
    <div class="flex justify-between items-center mb-2">
      <h1 class="text-2xl font-bold text-gray-800">Company Profile</h1>
      <div class="w-72">
        <CompanySearch />
      </div>
    </div>
    <CompanyProfile />
  </div>

  <!-- Analysis Section - Takes remaining height -->
  <div class="flex-1 min-h-0">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-xl font-bold text-gray-800">Overall Analysis</h2>
      
      <!-- Compact Chart Navigation -->
      <div class="flex space-x-1">
        {#each charts as chart}
          <button
            class="px-2 py-1 rounded-lg text-sm flex items-center space-x-1
                   {activeChart === chart.id ? 
                     'bg-blue-500 text-white' : 
                     'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
            on:click={() => activeChart = chart.id}
          >
            <span>{chart.icon}</span>
            <span class="hidden sm:inline">{chart.title}</span>
          </button>
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="flex justify-center items-center h-full">
        <div class="text-gray-600">Loading data...</div>
      </div>
    {:else if $companies.length > 0}
      <Card class="h-[calc(100%-40px)] p-4">
        {#if activeChart === 0}
          <ESGIndustryAnalysis data={$companies} expanded={false} />
        {:else if activeChart === 1}
          <MarketCapCorrelation data={$companies} expanded={false} />
        {:else if activeChart === 2}
          <ScoreComparison data={$companies} expanded={false} />
        {:else if activeChart === 3}
          <StockPriceCorrelation 
            data={$companies} 
            priceData={processedPriceData}
            expanded={false} 
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