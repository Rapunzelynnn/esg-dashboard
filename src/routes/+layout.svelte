<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  
  let navigation = [
    { path: '/', label: 'Company Profiles' },
    { path: '/analysis', label: 'Overall Analysis' }
  ];
</script>

<div class="min-h-screen bg-gray-50 flex">
  <!-- Main Content -->
  <main class="flex-1">
    <div class="py-8 px-8">
      <slot />
    </div>
  </main>
</div>
