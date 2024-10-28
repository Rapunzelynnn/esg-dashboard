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
                        month: 'MMM yyyy'
                    }
                },
                grid: {
                    display: true,
                    borderColor: 'transparent'
                },
                ticks: {
                    font: {
                        size: 12
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
                        size: 12
                    },
                    color: '#666',
                    callback: function(this: Scale<CoreScaleOptions>, tickValue: string | number) {
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
            console.log(`Processing ${symbolData.length} data points for ${sym}`);

            if (symbolData.length > 0) {
                data = {
                    datasets: [{
                        label: `${sym} Price`,
                        data: symbolData.map(d => ({
                            x: new Date(d.date).getTime(), // Convert Date to timestamp (number)
                            y: d.price
                        })),
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4
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

<div class="bg-white p-6 rounded-xl border border-gray-100">
    <h3 class="text-lg font-semibold mb-4">Stock Price Trend (2023)</h3>
    <div class="h-64 w-full">
        {#if error}
            <div class="h-full flex items-center justify-center text-red-500">
                Error loading chart: {error.message}
            </div>
        {:else if !data?.datasets[0]?.data?.length}
            <div class="h-full flex items-center justify-center text-gray-500">
                Loading price data...
            </div>
        {:else}
            <Line {data} {options} />
        {/if}
    </div>
</div>