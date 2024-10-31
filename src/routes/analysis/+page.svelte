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
  let selectedChart: number | null = null;
  let modalOpen = false;
  let processedPriceData: Record<string, PriceData[]> = {};

  // Function to process CSV data
  async function loadPriceData() {
    try {
      const response = await fetch('/processed_sp500_price_data.csv');
      const csvData = await response.text();
      
      // Get headers (symbols) from first row
      const [headerRow, ...dataRows] = csvData.split('\n');
      const symbols = headerRow.split(',').slice(1); // Skip 'Date' column
      
      // Process each row
      dataRows.forEach(row => {
        if (!row.trim()) return; // Skip empty rows
        
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
      // Load both data sets concurrently
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

  function openModal(chartIndex: number) {
    selectedChart = chartIndex;
    modalOpen = true;
  }

  function closeModal() {
    modalOpen = false;
    selectedChart = null;
  }

  // Helper function to get chart title
  function getChartTitle(index: number | null): string {
    if (index === null) return '';
    
    switch (index) {
      case 0: return 'ESG Score Breakdown by Industry';
      case 1: return 'ESG Score vs Market Cap';
      case 2: return 'ESG Score Comparison';
      case 3: return 'ESG vs. Stock Price';
      default: return '';
    }
  }
</script>

<!-- Modal for zoomed chart -->
{#if modalOpen && !loading && $companies.length > 0}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 w-[95%] h-[90%]">
      <div class="flex justify-between mb-6">
        <h2 class="text-xl font-semibold">
          {getChartTitle(selectedChart)}
        </h2>
        <button 
          class="text-gray-500 hover:text-gray-700 text-xl"
          on:click={closeModal}
        >
          ×
        </button>
      </div>
      <div class="h-[calc(100%-4rem)]">
        {#if selectedChart === 0}
          <ESGIndustryAnalysis data={$companies} expanded={true} />
        {:else if selectedChart === 1}
          <MarketCapCorrelation data={$companies} expanded={true} />
        {:else if selectedChart === 2}
          <ScoreComparison data={$companies} expanded={true} />
        {:else if selectedChart === 3}
          <StockPriceCorrelation 
            data={$companies} 
            priceData={processedPriceData}
            expanded={true} 
          />
        {/if}
      </div>
    </div>
  </div>
{/if}

<div class="max-w-[95%] mx-auto">
  <h1 class="text-3xl font-bold mb-8 text-gray-800">Overall Analysis</h1>
  
  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="text-gray-600">Loading data...</div>
    </div>
  {:else if $companies.length > 0}
    <div class="space-y-8">
      <!-- First row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Industry Analysis Chart -->
        <Card class="col-span-1 relative min-h-[400px]">
          <button 
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            on:click={() => openModal(0)}
          >
            🔍
          </button>
          <div class="p-8 h-full">
            <ESGIndustryAnalysis data={$companies} />
          </div>
        </Card>

        <!-- Market Cap Correlation Chart -->
        <Card class="col-span-1 relative min-h-[400px]">
          <button 
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            on:click={() => openModal(1)}
          >
            🔍
          </button>
          <div class="p-8 h-full">
            <MarketCapCorrelation data={$companies} />
          </div>
        </Card>
      </div>

      <!-- Second row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- ESG Score Comparison -->
        <Card class="col-span-1 relative min-h-[400px]">
          <button 
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            on:click={() => openModal(2)}
          >
            🔍
          </button>
          <div class="p-8 h-full">
            <ScoreComparison data={$companies} />
          </div>
        </Card>

        <!-- Stock Price Correlation -->
        <Card class="col-span-1 relative min-h-[400px]">
          <button 
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            on:click={() => openModal(3)}
          >
            🔍
          </button>
          <div class="p-8 h-full">
            <StockPriceCorrelation 
              data={$companies} 
              priceData={processedPriceData}
            />
          </div>
        </Card>
      </div>
    </div>
  {:else}
    <div class="text-center p-4">
      <p class="text-gray-600">No company data available</p>
    </div>
  {/if}
</div>