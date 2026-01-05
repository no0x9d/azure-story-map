<script lang="ts">
	import dagre from '@dagrejs/dagre';
	import {
		Background,
		Controls,
		type Edge,
		MarkerType,
		MiniMap,
		type Node,
		Panel,
		Position,
		SvelteFlow
	} from '@xyflow/svelte';
	import { Button, Dialog, Tabs } from 'bits-ui'
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { setLayoutContext } from '$lib/state.svelte.js';
	import { extractIdsFromCSV } from '$lib/extractIdsFromCSV';
	import StoryCard from '$lib/Story-Card.svelte';
	import type { PageProps } from './$types'

	import '@xyflow/svelte/dist/style.css';

	let { data }: PageProps = $props();
	let graph = $derived(data.graph);

	const nodeTypes = {
		storyCard: StoryCard,
	};

	let layout = $state({ isHorizontal: false });
	setLayoutContext(layout)

	// Dialog state and query parameters
	let dialogOpen = $state(false);
	let activeTab = $state<'query' | 'ids'>('query');
	let wiqlQuery = $state('');
	let idsList = $state('');
	let csvFileInput = $state<HTMLInputElement | null>(null);
	let csvParseError = $state('');

	// Initialize from URL parameters
	$effect.pre(() => {
		const params = page.url.searchParams;
		const wiqlParam = params.get('wiql');
		const idsParam = params.get('ids');

		if (idsParam) {
			idsList = idsParam.split(',').map(id => id.trim()).join('\n');
			activeTab = 'ids';
		}
		if (wiqlParam) {
			wiqlQuery = wiqlParam;
			activeTab = 'query';
		}
	})

	function updateUrlParams() {
		const params = new URLSearchParams(page.url.searchParams);

		// Remove old parameters
		params.delete('wiql');
		params.delete('ids');

		// Add new parameters based on active tab
		if (activeTab === 'query' && wiqlQuery.trim()) {
			params.set('wiql', wiqlQuery.trim());
		} else if (activeTab === 'ids' && idsList.trim()) {
			const idsArray = idsList
				.split('\n')
				.map(id => id.trim())
				.filter(id => id.length > 0);
			params.set('ids', idsArray.join(','));
		}

		// Update the URL
		const newUrl = `${page.url.pathname}?${params.toString()}`;
		goto(newUrl, {invalidateAll: true});
	}

	function handleConfirm() {
		updateUrlParams();
		dialogOpen = false;
	}

	async function handleCsvParse() {
		if (!csvFileInput?.files?.[0]) {
			csvParseError = 'Please select a CSV file';
			return;
		}

		csvParseError = '';

		try {
			const file = csvFileInput.files[0];
			const fileContent = await file.text();

			// Try to determine the ID column name
			const idColumn = 'ID'; // You can make this configurable if needed

			const ids = await extractIdsFromCSV({ fileContent, idColumn });
			idsList = ids.join('\n');

			// Reset the file input
			if (csvFileInput) {
				csvFileInput.value = '';
			}
		} catch (error) {
			csvParseError = error instanceof Error ? error.message : 'Error parsing CSV file';
		}
	}

	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	let initialNodes = $derived.by(() => graph.nodes.map(n => ({
		id: n.id.toString(10),
		type: "storyCard",
		data: n,
		position: { x: 0, y: 0 },
	})))


	let initialEdges =  $derived.by(() => graph.edges.map(e => ({
		id: `${e.from}-${e.to}`,
		source: e.from.toString(10),
		target: e.to.toString(10),
		label: e.name,
		markerEnd: {
			type: MarkerType.Arrow,
		},
	})))

	function getLayoutedElements(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'TB') {
		const isHorizontal = direction === 'LR';
		dagreGraph.setGraph({ rankdir: direction });

		nodes.forEach((node) => {
			dagreGraph.setNode(node.id, { width: nodeWidth(node), height: nodeHeight(node) });
		});

		edges.forEach((edge) => {
			dagreGraph.setEdge(edge.source, edge.target);
		});

		dagre.layout(dagreGraph);

		const layoutedNodes = nodes.map((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			node.targetPosition = isHorizontal ? Position.Left : Position.Top;
			node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

			// We are shifting the dagre node position (anchor=center center) to the top left
			// so it matches the React Flow node anchor point (top left).
			return {
				...node,
				position: {
					x: nodeWithPosition.x - nodeWidth(node) / 2,
					y: nodeWithPosition.y - nodeHeight(node) / 2,
				},
			};
		});

		// console.log(layoutedNodes);

		return { nodes: layoutedNodes, edges };
	}

	function nodeWidth(node: Node) {
		return node.measured?.width ?? 240;
	}

	function nodeHeight(node: Node) {
		return node.measured?.height ?? 36;
	}

	let nodes = $state.raw<Node[]>([]);
	let edges = $state.raw<Edge[]>([]);

	$effect(() => {
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			initialNodes,
			initialEdges,
		);
		nodes = layoutedNodes;
		edges = layoutedEdges;

		setTimeout(() => {
			// Force re-layout after initial render to get correct node sizes
			onLayout('TB');
		}, 5);
	})

	function onLayout(direction: 'LR' | 'TB') {
		layout.isHorizontal = direction === 'LR';
		const layoutedElements = getLayoutedElements(nodes, edges, direction);

		nodes = layoutedElements.nodes;
		edges = layoutedElements.edges;
	}
</script>

<div style:height="100vh">
	<SvelteFlow bind:nodes bind:edges {nodeTypes} fitView>
		<Controls />
		<Background />
		<MiniMap />
		<Panel position="top-left">
			<Dialog.Root bind:open={dialogOpen}>
				<Dialog.Trigger class="rounded outline p-1 bg-white">
					Configure Issues
				</Dialog.Trigger>
				<Dialog.Portal>
					<Dialog.Overlay />
					<Dialog.Content class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded shadow-lg p-6 max-w-2xl w-lg">
						<Dialog.Title>Configure Issues</Dialog.Title>
						<Tabs.Root bind:value={activeTab} class="w-full mt-4">
							<Tabs.List class="flex border-b">
								<Tabs.Trigger value="query" class="px-4 py-2 border-b-2 data-[state=active]:border-blue-500">
									Query
								</Tabs.Trigger>
								<Tabs.Trigger value="ids" class="px-4 py-2 border-b-2 data-[state=active]:border-blue-500">
									IDs
								</Tabs.Trigger>
							</Tabs.List>

							<Tabs.Content value="query" class="mt-4">
								<label for="wiql-query" class="block text-sm font-medium mb-2">WIQL Query</label>
								<textarea
									id="wiql-query"
									bind:value={wiqlQuery}
									class="w-full h-32 p-2 border rounded font-mono text-sm"
									placeholder="Enter your WIQL query here..."
								></textarea>
								<p class="text-xs text-gray-500 mt-2">Enter a Work Item Query Language (WIQL) query to filter issues</p>
							</Tabs.Content>

						<Tabs.Content value="ids" class="mt-4">
							<label for="ids-list" class="block text-sm font-medium mb-2">Issue IDs</label>

							<div class="mb-4 p-4 border rounded bg-gray-50">
								<label for="csv-file" class="block text-sm font-medium mb-2">Load IDs from CSV</label>
								<div class="flex gap-2">
									<input
										bind:this={csvFileInput}
										id="csv-file"
										type="file"
										accept=".csv"
										class="flex-1 p-2 border rounded text-sm"
									/>
									<button
										onclick={handleCsvParse}
										class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
									>
										Parse CSV
									</button>
								</div>
								{#if csvParseError}
									<p class="text-xs text-red-600 mt-2">{csvParseError}</p>
								{/if}
							</div>

							<textarea
								id="ids-list"
								bind:value={idsList}
								class="w-full h-32 p-2 border rounded font-mono text-sm"
								placeholder="Enter issue IDs, one per line..."
								rows="10"
							></textarea>
							<p class="text-xs text-gray-500 mt-2">Enter one issue ID per line</p>
						</Tabs.Content>
						</Tabs.Root>

						<div class="flex gap-2 mt-6 justify-end">
							<Dialog.Close class="px-4 py-2 border rounded hover:bg-gray-100">
								Cancel
							</Dialog.Close>
							<button
								onclick={handleConfirm}
								class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								Confirm
							</button>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</Panel>
		<Panel position="top-right">
			<Button.Root class="rounded outline p-1 bg-white" onclick={() => onLayout('TB')}>vertical layout</Button.Root>
			<button class="rounded outline p-1 bg-white" onclick={() => onLayout('LR')}>horizontal layout</button>
		</Panel>
	</SvelteFlow>
</div>
