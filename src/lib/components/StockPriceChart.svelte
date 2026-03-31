<script lang="ts">
    import { appState } from '$lib/state.svelte';
    import type { PriceData, StockChartOptions } from '$lib/types';
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
    import type { Scale, CoreScaleOptions, Point, ChartData } from 'chart.js';
    import 'chartjs-adapter-date-fns';

    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

    interface Props {
        symbol: string;
    }
    let { symbol }: Props = $props();
    let data = $state<ChartData<'line', Point[], unknown> | undefined>(undefined);

    const options: StockChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: {
                type: 'time',
                time: { unit: 'month', displayFormats: { month: 'MMM' } },
                grid: { display: false, borderColor: 'transparent' },
                ticks: { font: { size: 10 }, color: '#666', maxRotation: 45, minRotation: 45 }
            },
            y: {
                type: 'linear',
                display: true,
                grid: { borderColor: 'transparent' },
                ticks: {
                    font: { size: 10 },
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
                    label: (context) => `$${(context.raw as Point).y.toFixed(2)}`
                }
            },
            legend: { display: false }
        }
    };

    function buildChartData(sym: string, store: Map<string, PriceData[]>) {
        const symbolData = store.get(sym);
        if (!symbolData?.length) { data = undefined; return; }

        data = {
            datasets: [{
                label: `${sym} Price`,
                data: symbolData.map(d => ({ x: new Date(d.date).getTime(), y: d.price })),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 3
            }]
        };
    }

    $effect(() => {
        if (symbol) buildChartData(symbol, appState.priceData);
    });
</script>

<div class="bg-white rounded-lg h-full">
    <div class="text-sm font-medium text-gray-600 mb-1">Stock Price Trend (2023)</div>
    <div class="h-[calc(100%-2rem)]">
        {#if !data}
            <div class="h-full flex items-center justify-center text-gray-500 text-sm">
                No price data available for this symbol.
            </div>
        {:else}
            <Line {data} {options} />
        {/if}
    </div>
</div>