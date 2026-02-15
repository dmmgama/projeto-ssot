if (!window.supabaseClient) {
	throw new Error('supabaseClient não inicializado. Carrega js/supabase-config.js antes de js/supabase-auth.js');
}

const LOGIN_PAGE = 'login.html';
const LOBBY_PAGE = 'lobby_v11.1.html';

async function signupUser(email, password) {
	try {
		const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
		if (error) {
			return { success: false, error: error.message };
		}
		return { success: true, user: data.user };
	} catch (error) {
		return { success: false, error: error.message || 'Signup failed' };
	}
}

async function loginUser(email, password) {
	try {
		const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
		if (error) {
			return { success: false, error: error.message };
		}
		return { success: true, session: data.session };
	} catch (error) {
		return { success: false, error: error.message || 'Login failed' };
	}
}

async function logoutUser() {
	try {
		const { error } = await window.supabaseClient.auth.signOut();
		if (error) {
			return { success: false, error: error.message };
		}
		window.currentAuthSession = null;
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message || 'Logout failed' };
	}
}

async function getCurrentUser() {
	try {
		const { data, error } = await window.supabaseClient.auth.getUser();
		if (error || !data.user) {
			return { user: null };
		}
		return { user: data.user };
	} catch (_error) {
		return { user: null };
	}
}

function handleAuthNavigation(session) {
	const currentPage = window.location.pathname.split('/').pop().toLowerCase();
	const isLoginPage = currentPage === LOGIN_PAGE;
	const isLobbyPage = currentPage === LOBBY_PAGE || currentPage === 'lobby.html';

	if (session && isLoginPage) {
		window.location.href = LOBBY_PAGE;
		return;
	}

	if (!session && !isLoginPage && !isLobbyPage) {
		window.location.href = LOGIN_PAGE;
	}
}

const { data: authStateSubscription } = window.supabaseClient.auth.onAuthStateChange((_event, session) => {
	window.currentAuthSession = session;
	handleAuthNavigation(session);
});

window.authStateSubscription = authStateSubscription;
window.signupUser = signupUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.getCurrentUser = getCurrentUser;
