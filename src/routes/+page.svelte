<!-- $lib/routes/+page.svelte -->
<script lang="ts">
  import { appState } from '$lib/state.svelte';
  import { loadAllData } from '$lib/data';
  import { Card } from '$lib/components/ui/card';
  import CompanySearch from '$lib/components/CompanySearch.svelte';
  import CompanyProfile from '$lib/components/CompanyProfile.svelte';
  import ESGIndustryAnalysis from '$lib/components/ESGIndustryAnalysis.svelte';
  import MarketCapCorrelation from '$lib/components/MarketCapCorrelation.svelte';
  import ScoreComparison from '$lib/components/ScoreComparison.svelte';
  import StockPriceCorrelation from '$lib/components/StockPriceCorrelation.svelte';
  import type { PriceData } from '$lib/types';

  let loading = $state(true);
  let activeChart = $state(0);

  const charts = [
    { id: 0, title: 'Industrial Score Breakdown', icon: '📊' },
    { id: 1, title: 'ESG vs Market Cap', icon: '💰' },
    { id: 2, title: 'Score Comparison', icon: '⚖️' },
    { id: 3, title: 'ESG vs Stock Price', icon: '📉' }
  ];

  let priceDataRecord = $derived(
    Object.fromEntries(appState.priceData) as Record<string, PriceData[]>
  );

  $effect(() => {
    loadAllData()
      .catch((error) => console.error('Error loading data:', error))
      .finally(() => { loading = false; });
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
      <CompanyProfile {loading} />
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
            onclick={() => activeChart = chart.id}
          >
            <span>{chart.icon}</span>
            <span class="button-text">{chart.title}</span>
          </button>
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="centered-message">Loading data...</div>
    {:else if appState.companies.length > 0}
      <Card class="content-card" style="flex:1;display:flex;flex-direction:column;min-height:600px;">
        {#if activeChart === 0}
          <ESGIndustryAnalysis data={appState.companies} expanded={false} />
        {:else if activeChart === 1}
          <MarketCapCorrelation data={appState.companies} expanded={false} />
        {:else if activeChart === 2}
          <ScoreComparison data={appState.companies} expanded={false} />
        {:else if activeChart === 3}
          <StockPriceCorrelation
            data={appState.companies}
            priceData={priceDataRecord}
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
    padding: 16px;
    box-sizing: border-box;
    gap: 16px;
  }

  .profile-section {
    flex: 0 0 35%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 24px;
  }

  .analysis-section {
    flex: 0 0 65%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 24px;
  }

  .header-row {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
  }

  .title {
    font-size: 32px;
    font-weight: bold;
    margin: 0;
  }

  .search-box {
    width: 360px;
  }

  .chart-nav {
    display: flex;
    gap: 12px;
  }

  .nav-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border-radius: 8px;
    border: none;
    background: #f3f4f6;
    cursor: pointer;
    font-size: 18px;
  }

  .nav-button.active {
    background: #3b82f6;
    color: white;
  }

  .centered-message {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 18px;
  }

  :global(.card) {
    height: 100%;
    margin: 0;
    padding: 24px;
    display: flex;
    flex-direction: column;
  }

  :global(.chart-content) {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Ensure charts take full space */
  :global(.chart-container) {
    height: 100% !important;
    width: 100% !important;
  }

  /* Make sure SVG elements scale properly */
  :global(.recharts-wrapper),
  :global(.recharts-surface) {
    width: 100% !important;
    height: 100% !important;
  }
</style>