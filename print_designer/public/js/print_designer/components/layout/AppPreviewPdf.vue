<template>
	<div class="preview-wrapper">
		<!-- No document selected -->
		<div v-if="!MainStore.currentDoc" class="no-doc-notice">
			<div class="notice-inner">
				<span class="fa fa-eye notice-icon"></span>
				<p>{{ __("No document selected for preview.") }}</p>
				<p class="notice-sub">{{ __("Use the document selector in the canvas toolbar to choose a record, then click Preview again.") }}</p>
			</div>
		</div>

		<!-- Loading -->
		<div v-else-if="loading" class="no-doc-notice">
			<div class="notice-inner">
				<span class="fa fa-spinner fa-spin notice-icon"></span>
				<p>{{ __("Generating preview…") }}</p>
			</div>
		</div>

		<!-- Preview iframe -->
		<iframe
			v-else
			:src="previewUrl"
			class="preview-iframe"
			@load="onIframeLoad"
			@error="onIframeError"
		></iframe>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useMainStore } from "../../store/MainStore";

const MainStore = useMainStore();
const loading = ref(true);

const previewUrl = computed(() => {
	if (!MainStore.currentDoc || !MainStore.doctype || !MainStore.printDesignName) return "";
	const params = new URLSearchParams({
		doctype: MainStore.doctype,
		name: MainStore.currentDoc,
		print_format: MainStore.printDesignName,
		no_letterhead: "1",
	});
	return `/printview?${params.toString()}`;
});

onMounted(() => {
	// Small delay so the iframe src is committed before we show it
	if (MainStore.currentDoc) {
		loading.value = true;
	}
});

const onIframeLoad = () => {
	loading.value = false;
};

const onIframeError = () => {
	loading.value = false;
	frappe.show_alert({ message: __("Preview failed to load."), indicator: "red" }, 5);
};
</script>

<style lang="scss" scoped>
.preview-wrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	background-color: var(--subtle-fg);
}

.preview-iframe {
	flex: 1;
	width: 100%;
	height: 100%;
	border: none;
	background: #fff;
}

.no-doc-notice {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;

	.notice-inner {
		text-align: center;
		color: var(--text-muted);
		max-width: 360px;

		.notice-icon {
			font-size: 2.5rem;
			margin-bottom: 12px;
			display: block;
		}

		p {
			margin: 4px 0;
			font-size: var(--text-md);
		}

		.notice-sub {
			font-size: var(--text-sm);
			margin-top: 8px;
		}
	}
}
</style>
