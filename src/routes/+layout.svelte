<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  
  let navigation = [
    { path: '/', label: 'Company Profiles' },
    { path: '/analysis', label: 'Overall Analysis' }
  ];
</script>

<div class="min-h-screen bg-gray-50 flex">
  <!-- Sidebar -->
  <aside class="w-64 bg-white shadow-sm">
    <nav class="px-4 py-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">ESG Dashboard</h2>
      {#each navigation as item}
        <a
          href={item.path}
          class="block px-4 py-2 mb-2 rounded-md text-gray-700 hover:bg-gray-100 {$page.url.pathname === item.path ? 'bg-gray-100' : ''}"
        >
          {item.label}
        </a>
      {/each}
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="flex-1">
    <div class="py-8 px-8">
      <slot />
    </div>
  </main>
</div>
