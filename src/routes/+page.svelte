<!-- $lib/routes/+page.svelte -->
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

<div class="root-container">
  <!-- Company Profile Section -->
  <div class="profile-section">
    <div class="header-row">
      <h1 class="title">Company Profile</h1>
      <div class="search-box">
        <CompanySearch />
      </div>
    </div>
    <div class="profile-content">
      <CompanyProfile />
    </div>
  </div>

  <!-- Analysis Section -->
  <div class="analysis-section">
    <div class="header-row">
      <h2 class="title">Overall Analysis</h2>
      <div class="chart-nav">
        {#each charts as chart}
          <button
            class="nav-button {activeChart === chart.id ? 'active' : ''}"
            on:click={() => activeChart = chart.id}
          >
            <span>{chart.icon}</span>
            <span class="button-text">{chart.title}</span>
          </button>
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="centered-message">Loading data...</div>
    {:else if $companies.length > 0}
      <Card class="content-card">
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
      <div class="centered-message">No company data available</div>
    {/if}
  </div>
</div>

<style>
  .root-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 8px; /* Reduced padding */
    box-sizing: border-box;
    gap: 8px;
  }

  .profile-section {
    flex: 0 0 25%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 16px; /* Added horizontal padding */
  }

  .analysis-section {
    flex: 0 0 75%;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 16px; /* Added horizontal padding */
  }

  .header-row {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 36px;
    margin-bottom: 4px;
  }

  .title {
    font-size: 24px;
    font-weight: bold;
    margin: 0;
  }

  .search-box {
    width: 300px;
  }

  .chart-nav {
    display: flex;
    gap: 8px;
  }

  .nav-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 16px;
    border-radius: 6px;
    border: none;
    background: #f3f4f6;
    cursor: pointer;
    font-size: 14px;
  }

  .nav-button.active {
    background: #3b82f6;
    color: white;
  }

  .content-card {
    flex: 1;
    height: calc(100% - 40px);
    min-height: 400px;
  }

  .centered-message {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  :global(.card) {
    height: 100%;
    margin: 0;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  :global(.chart-content) {
    flex: 1;
    height: 100%;
    overflow: visible;
  }

  /* Ensure charts expand to fill width */
  :global(.recharts-wrapper),
  :global(.recharts-surface) {
    width: 100% !important;
  }
</style>