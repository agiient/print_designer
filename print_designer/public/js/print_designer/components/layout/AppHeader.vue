<template>
	<div class="header">
		<a class="navbar-brand navbar-home" href="/app">
			<img
				class="app-icon"
				style="width: 32px"
				src="/assets/print_designer/images/print-designer-logo.svg"
			/>
		</a>
		<h3
			class="title"
			:contenteditable="contenteditable"
			@keydown="handleKeyDown"
			@click="handleCLick"
			@blur="editNameOnBlur"
		>
			{{ print_format_name }}
		</h3>
		<span class="indicator-pill no-indicator-dot ellipsis gray">Beta</span>

		<!-- DocType selector -->
		<div class="doctype-selector">
			<span class="doctype-label">{{ __("DocType") }}:</span>
			<span
				class="doctype-value"
				:title="__('Click to change linked DocType')"
				@click="openDoctypeDialog"
			>
				{{ MainStore.doctype || __("None") }}
				<span class="fa fa-pencil edit-icon"></span>
			</span>
		</div>

		<!-- Preview / Edit toggle -->
		<button
			class="btn btn-sm preview-btn"
			:class="MainStore.isPreviewMode ? 'btn-primary' : 'btn-default'"
			@click="togglePreview"
			:title="MainStore.isPreviewMode ? __('Back to Editor') : __('Preview PDF')"
		>
			<span
				:class="MainStore.isPreviewMode ? 'fa fa-pencil' : 'fa fa-eye'"
			></span>
			<span>{{ MainStore.isPreviewMode ? __("Edit") : __("Preview") }}</span>
		</button>

		<!-- Duplicate for another DocType -->
		<button class="btn btn-sm btn-default duplicate-btn" @click="duplicateForDocType" :title="__('Copy this template for a different DocType')">
			<span class="fa fa-copy"></span>
			<span>{{ __("Duplicate") }}</span>
		</button>

		<button class="btn btn-sm btn-default exit-btn" @click="goToLastPage">
			<svg
				width="14"
				height="14"
				viewBox="0 0 16 16"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<use href="#es-line-log-out" style="--icon-stroke: var(--invert-neutral)" />
			</svg>
			<span>Exit</span>
		</button>
	</div>
</template>
<script setup>
import { ref } from "vue";
import { useMainStore } from "../../store/MainStore";
import { selectElementContents } from "../../utils";
import { fetchMeta } from "../../store/fetchMetaAndData";

const MainStore = useMainStore();

const contenteditable = ref(false);

const handleCLick = (e) => {
	if (!contenteditable.value) {
		contenteditable.value = true;
	}
	setTimeout(function () {
		if (document.activeElement !== e.target) {
			e.target.focus();
			selectElementContents(e.target);
		} else {
			e.target.focus();
		}
	}, 0);
};

const editNameOnBlur = (e) => {
	contenteditable.value = false;
	const new_name = e.target.innerText.trim();
	const doctype = "Print Format";
	const docname = MainStore.printDesignName;
	if (new_name === "" || new_name === docname) {
		e.target.innerText = docname;
		return;
	}
	if (new_name === docname) return;

	const callback = (r, rt) => {
		if (!r.exc) {
			$(document).trigger("rename", [doctype, docname, r.message || new_name]);
			if (locals[doctype] && locals[doctype][docname]) delete locals[doctype][docname];
			frappe.set_route();
			frappe.set_route("print-designer", new_name);
		}
	};

	frappe.call({
		method: "frappe.rename_doc",
		freeze: true,
		freeze_message: "Renaming Format Name...",
		args: {
			doctype: doctype,
			old: docname,
			new: new_name,
			merge: false,
		},
		callback: callback,
	});
};

const handleKeyDown = (e) => {
	if (["Escape", "Enter", "Tab"].indexOf(e.key) != -1) {
		e.target.blur();
	}
	if (e.key == "Tab") {
		e.preventDefault();
	}
};

const props = defineProps({
	print_format_name: String,
});

const goToLastPage = () => {
	let prev_route = frappe.get_prev_route();
	if (prev_route[0] !== "print-designer") {
		frappe.set_route(prev_route);
	} else {
		frappe.set_route();
	}
};

// ── Preview toggle ────────────────────────────────────────────────────────
const togglePreview = () => {
	MainStore.isPreviewMode = !MainStore.isPreviewMode;
	// When returning to edit, ensure the marquee/selection state is correct
	// for whatever tool was active before preview.
	if (!MainStore.isPreviewMode) {
		MainStore.isMarqueeActive = MainStore.activeControl === "mouse-pointer";
		MainStore.isDrawing = ["rectangle", "image", "table", "barcode"].includes(
			MainStore.activeControl
		);
	}
};

// ── Duplicate for another DocType ─────────────────────────────────────────
const duplicateForDocType = () => {
	const d = new frappe.ui.Dialog({
		title: __("Duplicate Template for Another DocType"),
		fields: [
			{
				label: __("New Template Name"),
				fieldname: "new_name",
				fieldtype: "Data",
				default: MainStore.printDesignName + " (Copy)",
				reqd: 1,
			},
			{
				label: __("Target DocType"),
				fieldname: "doctype",
				fieldtype: "Link",
				options: "DocType",
				default: MainStore.doctype,
				reqd: 1,
				description: __("The duplicated template will be linked to this DocType. All layout, colors, and fonts are preserved; dynamic fields referencing the original DocType will still need to be re-mapped if the field names differ."),
			},
		],
		primary_action_label: __("Duplicate"),
		primary_action: async ({ new_name, doctype }) => {
			if (!new_name || !doctype) return;
			frappe.dom.freeze(__("Duplicating…"));
			try {
				// Rename (copy) via frappe.copy_doc
				const result = await frappe.call({
					method: "frappe.client.copy_doc",
					args: { doc: await frappe.db.get_doc("Print Format", MainStore.printDesignName) },
				});
				const newDoc = result.message;
				newDoc.name = new_name;
				newDoc.doc_type = doctype;
				await frappe.db.insert(newDoc);
				frappe.dom.unfreeze();
				frappe.show_alert({ message: __("Duplicated as {0}", [new_name]), indicator: "green" }, 5);
				d.hide();
				// Offer to open the duplicate
				frappe.confirm(
					__("Open the duplicated template now?"),
					() => frappe.set_route("print-designer", new_name)
				);
			} catch (err) {
				frappe.dom.unfreeze();
				frappe.show_alert({ message: __("Duplicate failed: {0}", [err.message || err]), indicator: "red" }, 6);
			}
		},
	});
	d.show();
};

// ── DocType selector ──────────────────────────────────────────────────────
const openDoctypeDialog = () => {
	const d = new frappe.ui.Dialog({
		title: __("Change Linked DocType"),
		fields: [
			{
				label: __("DocType"),
				fieldname: "doctype",
				fieldtype: "Link",
				options: "DocType",
				default: MainStore.doctype,
				reqd: 1,
			},
		],
		primary_action_label: __("Apply"),
		primary_action: async ({ doctype }) => {
			if (!doctype || doctype === MainStore.doctype) {
				d.hide();
				return;
			}
			// Persist to the Print Format record
			await frappe.db.set_value("Print Format", MainStore.printDesignName, "doc_type", doctype);
			MainStore.doctype = doctype;
			// Reload field meta for the new doctype
			await fetchMeta();
			frappe.show_alert({ message: __("DocType updated to {0}", [doctype]), indicator: "green" }, 4);
			d.hide();
		},
	});
	d.show();
};
</script>
<style scoped lang="scss">
.header {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	height: calc(var(--navbar-height) - 1px);
	z-index: 1020;
	user-select: none;
	background-color: var(--navbar-bg);

	.app-icon {
		flex: 1;
		margin-left: 6px;
	}

	.title {
		flex: auto;
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		letter-spacing: 0.015em;
		margin-bottom: 0;
		user-select: none;
		cursor: text;
	}

	.doctype-selector {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-sm);
		color: var(--text-muted);
		white-space: nowrap;

		.doctype-label {
			font-weight: 500;
		}

		.doctype-value {
			cursor: pointer;
			color: var(--text-color);
			border-bottom: 1px dashed var(--gray-400);
			padding-bottom: 1px;
			display: flex;
			align-items: center;
			gap: 4px;

			&:hover {
				color: var(--primary);
				border-bottom-color: var(--primary);
			}

			.edit-icon {
				font-size: 10px;
				opacity: 0.6;
			}
		}
	}

	.preview-btn,
	.duplicate-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 10px;
		white-space: nowrap;
	}

	.exit-btn {
		margin-right: 16px;
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
	}

	[contenteditable] {
		outline: none;
		padding: 6px 8px;
		&:hover {
			padding-bottom: 5px;
			border-bottom: 1px solid #d5c291;
		}
		&:focus {
			border-bottom: 1px solid var(--primary);
			padding-bottom: 5px;
		}
	}
}
</style>
