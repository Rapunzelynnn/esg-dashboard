<script lang="ts">
  import { onMount } from 'svelte';
  import { loadCompanyData, companies } from '$lib/stores';
  import { Card } from '$lib/components/ui/card';
  import ESGIndustryAnalysis from '$lib/components/ESGIndustryAnalysis.svelte';
  import MarketCapCorrelation from '$lib/components/MarketCapCorrelation.svelte';
  import ScoreComparison from '$lib/components/ScoreComparison.svelte';
  import StockPriceCorrelation from '$lib/components/StockPriceCorrelation.svelte';
  import type { Company } from '$lib/types';

  let loading = true;
  let selectedChart: number | null = null;
  let modalOpen = false;

  onMount(async () => {
    try {
      await loadCompanyData();
    } catch (error) {
      console.error('Error loading company data:', error);
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
</script>

<!-- Modal for zoomed chart -->
{#if modalOpen && !loading && $companies.length > 0}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-8 w-[95%] h-[90%]"> <!-- Increased size -->
      <div class="flex justify-between mb-6">
        <h2 class="text-xl font-semibold">
          {selectedChart === 0 ? 'ESG Score Breakdown by Industry' : 
           selectedChart === 1 ? 'ESG Score vs Market Cap' : 
           selectedChart === 2 ? 'ESG Score Comparison' : 'ESG vs. Stock Price'}
        </h2>
        <button 
          class="text-gray-500 hover:text-gray-700 text-xl"
          on:click={closeModal}
        >
          ×
        </button>
      </div>
      <div class="h-[calc(100%-4rem)]"> <!-- Adjusted height to account for header -->
        {#if selectedChart === 0}
          <ESGIndustryAnalysis data={$companies} expanded={true} />
        {:else if selectedChart === 1}
          <MarketCapCorrelation data={$companies} expanded={true} />
        {:else if selectedChart === 2}
          <ScoreComparison data={$companies} expanded={true} />
        {:else if selectedChart === 3}
          <StockPriceCorrelation data={$companies} expanded={true} />
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- In your +page.svelte -->
<div class="max-w-[95%] mx-auto"> <!-- Changed from max-w-7xl to use more screen width -->
  <h1 class="text-3xl font-bold mb-8 text-gray-800">Overall Analysis</h1>
  
  {#if loading}
    <!-- Loading state remains the same -->
  {:else if $companies.length > 0}
    <div class="space-y-8"> <!-- Increased spacing between rows -->
      <!-- First row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8"> <!-- Increased gap -->
        <!-- Industry Analysis Chart -->
        <Card class="col-span-1 relative min-h-[400px]"> <!-- Added min-height -->
          <button 
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
            on:click={() => openModal(0)}
          >
            🔍
          </button>
          <div class="p-8 h-full"> <!-- Increased padding -->
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
            <StockPriceCorrelation data={$companies} />
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