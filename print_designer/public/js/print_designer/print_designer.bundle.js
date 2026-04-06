import { createApp } from "vue";
import { createPinia } from "pinia";
import Designer from "./App.vue";
class PrintDesigner {
	constructor({ wrapper, print_format }) {
		this.$wrapper = $(wrapper);
		this.print_format = print_format;
		const app = createApp(Designer, { print_format_name: this.print_format });
		app.use(createPinia());
		SetVueGlobals(app);
		// Ensure the print designer header (position:absolute; top:0; left:0) is
		// scoped to the app wrapper, not a distant ancestor that includes the
		// Frappe workspace sidebar.
		this.$wrapper[0].style.position = "relative";
		app.mount(this.$wrapper.get(0));

		// Expand Frappe's top-navbar container to full width
		let headerContainer = document.querySelector("header .container");
		headerContainer.style.width = "100%";
		headerContainer.style.minWidth = "100%";
		headerContainer.style.userSelect = "none";

		// Hide Frappe's workspace sidebar so it doesn't fight z-index with the
		// print designer header (both are z-index 1020). Print designer is a
		// full-page editor; the sidebar is not useful here.
		const sidebarContainer = document.querySelector(".body-sidebar-container");
		const sidebarPlaceholder = document.querySelector(".body-sidebar-placeholder");
		if (sidebarContainer) sidebarContainer.style.display = "none";
		if (sidebarPlaceholder) sidebarPlaceholder.style.display = "none";

		// Hide Frappe's page-head (breadcrumbs/title bar) so the canvas sits
		// flush against the navbar — print designer has its own header bar.
		const pageHead = document.querySelector(".page-head");
		if (pageHead) pageHead.style.display = "none";

		frappe.router.once("change", () => {
			// Restore everything on route change (exit)
			this.$wrapper[0].style.position = "";
			headerContainer.style.width = null;
			headerContainer.style.minWidth = null;
			headerContainer.style.userSelect = "auto";
			if (sidebarContainer) sidebarContainer.style.display = "";
			if (sidebarPlaceholder) sidebarPlaceholder.style.display = "";
			if (pageHead) pageHead.style.display = "";
			app.unmount();
		});
	}
}

frappe.provide("frappe.ui");
frappe.ui.PrintDesigner = PrintDesigner;
export default PrintDesigner;
