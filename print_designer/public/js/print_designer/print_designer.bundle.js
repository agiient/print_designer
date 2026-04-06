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

		// Make the print designer a full-viewport overlay at z-index 1030 so it
		// sits cleanly above the Frappe navbar (z-index ~1019) and sidebar
		// (z-index 1020) regardless of how Frappe positions its page wrapper.
		const wrapperEl = this.$wrapper[0];
		wrapperEl.style.position = "fixed";
		wrapperEl.style.top = "0";
		wrapperEl.style.left = "0";
		wrapperEl.style.width = "100vw";
		wrapperEl.style.height = "100vh";
		wrapperEl.style.zIndex = "1030";

		app.mount(wrapperEl);

		// Hide the sidebar and page-head (behind the overlay but prevents visual
		// noise if the overlay ever has a transparent region).
		const sidebarContainer = document.querySelector(".body-sidebar-container");
		const sidebarPlaceholder = document.querySelector(".body-sidebar-placeholder");
		if (sidebarContainer) sidebarContainer.style.display = "none";
		if (sidebarPlaceholder) sidebarPlaceholder.style.display = "none";
		const pageHead = document.querySelector(".page-head");
		if (pageHead) pageHead.style.display = "none";

		frappe.router.once("change", () => {
			// Restore everything on route change (exit)
			wrapperEl.style.position = "";
			wrapperEl.style.top = "";
			wrapperEl.style.left = "";
			wrapperEl.style.width = "";
			wrapperEl.style.height = "";
			wrapperEl.style.zIndex = "";
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
