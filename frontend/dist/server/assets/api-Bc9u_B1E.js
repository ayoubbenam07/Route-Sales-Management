import axios from "axios";
var api = axios.create({
	baseURL: "https://route-sales-management.vercel.app/api",
	withCredentials: true,
	headers: { "Content-Type": "application/json" }
});
var getProducts = async () => {
	return (await api.get("/products")).data.data;
};
var createProduct = async (data) => {
	return (await api.post("/products", data)).data.data;
};
var getSupermarkets = async () => {
	return (await api.get("/supermarkets")).data.data;
};
var getDeals = async (status) => {
	const params = status && status !== "ALL" ? { status } : {};
	return (await api.get("/deals", { params })).data.data;
};
var createDeal = async (data) => {
	return (await api.post("/deals", data)).data.data;
};
var getAdminDashboard = async () => {
	return (await api.get("/analytics/admin-dashboard")).data.data;
};
var getBuyerDashboard = async () => {
	return (await api.get("/analytics/buyer-dashboard")).data.data;
};
var createBuyer = async (data) => {
	return (await api.post("/auth/create_buyer", data)).data.data;
};
var login = async (data) => {
	return (await api.post("/auth/login", data)).data.data;
};
var logout = async () => {
	await api.post("/auth/logout");
};
//#endregion
export { getBuyerDashboard as a, getSupermarkets as c, getAdminDashboard as i, login as l, createDeal as n, getDeals as o, createProduct as r, getProducts as s, createBuyer as t, logout as u };
