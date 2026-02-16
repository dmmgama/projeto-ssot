async function signupUser(email, password) {
	try {
		const { data, error } = await window.supabaseClient.auth.signUp({
			email,
			password
		});
		if (error) {
			return { success: false, error: error.message };
		}
		return { success: true, user: data.user };
	} catch (err) {
		return { success: false, error: err.message };
	}
}

async function loginUser(email, password) {
	try {
		const { data, error } = await window.supabaseClient.auth.signInWithPassword({
			email,
			password
		});
		if (error) {
			return { success: false, error: error.message };
		}
		return { success: true, session: data.session };
	} catch (err) {
		return { success: false, error: err.message };
	}
}

async function logoutUser() {
	try {
		const { error } = await window.supabaseClient.auth.signOut();
		if (error) {
			return { success: false, error: error.message };
		}
		return { success: true };
	} catch (err) {
		return { success: false, error: err.message };
	}
}

async function getCurrentUser() {
	try {
		const {
			data: { user },
			error
		} = await window.supabaseClient.auth.getUser();
		if (error) {
			return { user: null };
		}
		return { user };
	} catch (_error) {
		return { user: null };
	}
}

window.supabaseClient.auth.onAuthStateChange((event, session) => {
	console.log('Auth event:', event, session);
});

window.signupUser = signupUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.getCurrentUser = getCurrentUser;
