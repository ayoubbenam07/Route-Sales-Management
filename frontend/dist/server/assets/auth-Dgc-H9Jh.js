import { create } from "zustand";
//#region src/stores/auth.ts
var KEY = "rs-auth-user";
function readUser() {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}
var useAuth = create((set) => ({
	user: null,
	hydrated: false,
	hydrate: () => {
		set({
			user: readUser(),
			hydrated: true
		});
	},
	login: (user) => {
		if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(user));
		set({
			user,
			hydrated: true
		});
	},
	logout: () => {
		if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
		set({ user: null });
	}
}));
//#endregion
export { useAuth as t };
