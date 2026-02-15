if (!window.supabaseClient) {
	throw new Error('supabaseClient não inicializado. Carrega js/supabase-config.js antes de js/supabase-database.js');
}

async function getAuthenticatedUserId() {
	const { user } = await window.getCurrentUser();
	if (!user?.id) {
		throw new Error('Utilizador não autenticado');
	}
	return user.id;
}

async function createProject(projectData) {
	try {
		const userId = await getAuthenticatedUserId();
		const payload = {
			user_id: userId,
			...projectData
		};

		const { data, error } = await window.supabaseClient
			.from('projects')
			.insert(payload)
			.select()
			.single();

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true, project: data };
	} catch (error) {
		return { success: false, error: error.message || 'Erro ao criar projeto' };
	}
}

async function getProject(projectId) {
	const { data, error } = await window.supabaseClient
		.from('projects')
		.select('*')
		.eq('id', projectId)
		.single();

	if (error) {
		return { project: null, error: error.message };
	}

	return { project: data };
}

async function updateProject(projectId, updates) {
	const { error } = await window.supabaseClient
		.from('projects')
		.update(updates)
		.eq('id', projectId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

async function deleteProject(projectId) {
	const { error } = await window.supabaseClient
		.from('projects')
		.delete()
		.eq('id', projectId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

async function listUserProjects() {
	const { data, error } = await window.supabaseClient
		.from('projects')
		.select('id, nome_projeto, cliente, updated_at')
		.order('updated_at', { ascending: false });

	if (error) {
		return { success: false, projects: [], error: error.message };
	}

	return { success: true, projects: data || [] };
}

window.createProject = createProject;
window.getProject = getProject;
window.updateProject = updateProject;
window.deleteProject = deleteProject;
window.listUserProjects = listUserProjects;
