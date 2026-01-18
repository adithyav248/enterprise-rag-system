// If we are in production (deployed), use the Environment Variable.
// If we are local, use localhost.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default API_URL;