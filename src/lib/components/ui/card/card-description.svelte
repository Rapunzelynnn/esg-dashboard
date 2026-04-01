<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	interface Props extends HTMLAttributes<HTMLParagraphElement> {}
	let { class: className, children, ...rest }: Props = $props();
</script>

<p class={cn("text-muted-foreground text-sm", className)} {...rest}>
	{@render children?.()}
</p>
