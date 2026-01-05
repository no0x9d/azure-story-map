<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<div class="app">
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
	}

	main {
		box-sizing: border-box;
	}

</style>
