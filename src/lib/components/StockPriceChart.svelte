<script lang="ts">
    import { onMount } from 'svelte';
    import { priceDataStore, loadPriceData } from '$lib/stores';
    import type { PriceData, StockChartData, StockChartOptions } from '$lib/types';
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
        TimeScale
    } from 'chart.js';
    import type { 
        Scale, 
        CoreScaleOptions, 
        Point, 
        ChartData 
    } from 'chart.js';
    import 'chartjs-adapter-date-fns';

    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        TimeScale
    );

    export let symbol: string;
    let data: ChartData<'line', Point[], unknown> | undefined = undefined;
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
                type: 'time',
                time: {
                    unit: 'month',
                    displayFormats: {
                        month: 'MMM'
                    }
                },
                grid: {
                    display: false,
                    borderColor: 'transparent'
                },
                ticks: {
                    font: {
                        size: 10
                    },
                    color: '#666',
                    maxRotation: 45,
                    minRotation: 45
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
                        size: 10
                    },
                    color: '#666',
                    callback: function(this: Scale<CoreScaleOptions>, tickValue: string | number) {
                        return `$${Number(tickValue).toFixed(0)}`;
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
                padding: 4,
                cornerRadius: 4,
                displayColors: false,
                callbacks: {
                    label: (context) => {
                        const point = context.raw as Point;
                        return `$${point.y.toFixed(2)}`;
                    }
                }
            },
            legend: {
                display: false
            }
        }
    };

    async function loadChartData(sym: string) {
        try {
            error = null;
            data = undefined;
            
            await loadPriceData(sym);
            
            const symbolData = $priceDataStore.get(sym) || [];

            // Filter to show more frequent data points (every 3-4 days instead of 14)
            const filteredData = symbolData.filter((_, index) => index % 1 === 0);

            if (filteredData.length > 0) {
                data = {
                    datasets: [{
                        label: `${sym} Price`,
                        data: filteredData.map(d => ({
                            x: new Date(d.date).getTime(),
                            y: d.price
                        })),
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.1, // Reduced tension for less smoothing
                        borderWidth: 1.5,
                        pointRadius: 0,
                        pointHoverRadius: 3
                    }]
                };
            }
        } catch (e) {
            error = e as Error;
            console.error('Error loading chart data:', e);
        }
    }

    $: {
        if (symbol) {
            loadChartData(symbol);
        }
    }

    onMount(() => {
        if (symbol) {
            loadChartData(symbol);
        }
    });
</script>

<div class="bg-white rounded-lg h-full">
    <div class="text-sm font-medium text-gray-600 mb-1">Stock Price Trend (2023)</div>
    <div class="h-[calc(100%-2rem)]">
        {#if error}
            <div class="h-full flex items-center justify-center text-red-500 text-sm">
                Error loading chart: {error.message}
            </div>
        {:else if !data?.datasets[0]?.data?.length}
            <div class="h-full flex items-center justify-center text-gray-500 text-sm">
                Loading price data...
            </div>
        {:else}
            <Line {data} {options} />
        {/if}
    </div>
</div>