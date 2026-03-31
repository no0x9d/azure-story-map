<script lang="ts">
  import './layout.css';

  let { children } = $props();
</script>

<div class="min-h-screen">
  <main class="box-border">
    {@render children()}
  </main>
</div>
