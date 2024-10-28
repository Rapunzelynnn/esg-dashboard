<script lang="ts">
    import { onMount } from 'svelte';
    import { priceDataStore, loadPriceData } from '$lib/stores';
    import type { PriceData, StockChartData, StockChartOptions } from '$lib/types';
    import type { Tick } from 'chart.js';
    import { Line } from 'svelte-chartjs';
    import {
        Chart as ChartJS,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
    } from 'chart.js';

    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
    );

    export let symbol: string;
    let data: StockChartData | undefined = undefined;
    let error: Error | null = null;

    const options: StockChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        scales: {
            x: {
                type: 'category',
                display: true,
                grid: {
                    display: true,
                    borderColor: 'transparent'
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    color: '#666',
                    callback(tickValue: string | number, index: number, ticks: Tick[]) {
                        return String(tickValue);
                    }
                }
            },
            y: {
                type: 'linear',
                display: true,
                grid: {
                    borderColor: 'transparent'
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    color: '#666',
                    callback(tickValue: string | number, index: number, ticks: Tick[]) {
                        return `$${Number(tickValue).toFixed(2)}`;
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'white',
                titleColor: '#000',
                bodyColor: '#666',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 8,
                cornerRadius: 4,
                displayColors: false,
                callbacks: {
                    label(context) {
                        return `$${context.parsed.y.toFixed(2)}`;
                    }
                }
            },
            legend: {
                display: false
            }
        }
    };

    $: {
        const symbolData = $priceDataStore.get(symbol) || [];
        console.log(`Processing ${symbolData.length} data points for ${symbol}`);
        
        if (symbolData.length > 0) {
            data = {
                labels: symbolData.map(d => new Date(d.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })),
                datasets: [{
                    label: `${symbol} Price`,
                    data: symbolData.map(d => d.price),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            };

            // Only log if data is defined
            if (data) {
                console.log('Chart data prepared:', {
                    labels: data.labels?.length || 0,
                    dataPoints: data.datasets[0]?.data?.length || 0
                });
            }
        } else {
            data = undefined;
        }
    }
    onMount(async () => {
        try {
            if (!$priceDataStore.has(symbol)) {
                await loadPriceData(symbol);
            }
        } catch (e) {
            error = e as Error;
            console.error('Error loading price data:', e);
        }
    });
</script>

<div class="bg-white p-6 rounded-xl border border-gray-100">
    <h3 class="text-lg font-semibold mb-4">Stock Price Trend (2023)</h3>
    <div class="h-64 w-full">
        {#if error}
            <div class="h-full flex items-center justify-center text-red-500">
                Error loading chart: {error.message}
            </div>
        {:else if !data || !data.datasets[0]?.data?.length}
            <div class="h-full flex items-center justify-center text-gray-500">
                {$priceDataStore.has(symbol) ? 'No price data available' : 'Loading price data...'}
            </div>
        {:else}
            <Line {data} {options} />
        {/if}
    </div>
</div>