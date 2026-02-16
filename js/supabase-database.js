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

async function createBlock(projectId, blockData) {
	const { data, error } = await window.supabaseClient
		.from('blocks')
		.insert({
			project_id: projectId,
			...blockData
		})
		.select()
		.single();

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true, block: data };
}

async function updateBlock(blockId, updates) {
	const { error } = await window.supabaseClient
		.from('blocks')
		.update(updates)
		.eq('id', blockId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

async function deleteBlock(blockId) {
	const { count: floorCount } = await window.supabaseClient
		.from('floors')
		.select('id', { count: 'exact', head: true })
		.eq('block_id', blockId);

	const { error } = await window.supabaseClient
		.from('blocks')
		.delete()
		.eq('id', blockId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true, deletedCount: floorCount || 0 };
}

async function listProjectBlocks(projectId) {
	const { data, error } = await window.supabaseClient
		.from('blocks')
		.select('*')
		.eq('project_id', projectId)
		.order('created_at', { ascending: true });

	if (error) {
		return { success: false, blocks: [], error: error.message };
	}

	return { success: true, blocks: data || [] };
}

window.createBlock = createBlock;
window.updateBlock = updateBlock;
window.deleteBlock = deleteBlock;
window.listProjectBlocks = listProjectBlocks;

async function createFloor(blockId, projectId, floorData) {
	const { data, error } = await window.supabaseClient
		.from('floors')
		.insert({
			block_id: blockId,
			project_id: projectId,
			...floorData
		})
		.select()
		.single();

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true, floor: data };
}

async function updateFloor(floorId, updates) {
	const { error } = await window.supabaseClient
		.from('floors')
		.update(updates)
		.eq('id', floorId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

async function deleteFloor(floorId) {
	if (typeof window.deleteFloorImage === 'function') {
		await window.deleteFloorImage(floorId);
	}

	const { error } = await window.supabaseClient
		.from('floors')
		.delete()
		.eq('id', floorId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

async function listBlockFloors(blockId) {
	const { data, error } = await window.supabaseClient
		.from('floors')
		.select('*')
		.eq('block_id', blockId)
		.order('cota', { ascending: true });

	if (error) {
		return { success: false, floors: [], error: error.message };
	}

	return { success: true, floors: data || [] };
}

async function getFloor(floorId) {
	const { data, error } = await window.supabaseClient
		.from('floors')
		.select('*')
		.eq('id', floorId)
		.single();

	if (error) {
		return { floor: null, error: error.message };
	}

	return { floor: data };
}

window.createFloor = createFloor;
window.updateFloor = updateFloor;
window.deleteFloor = deleteFloor;
window.listBlockFloors = listBlockFloors;
window.getFloor = getFloor;

async function createZone(floorId, projectId, zoneData) {
	const { data, error } = await window.supabaseClient
		.from('zones')
		.insert({
			floor_id: floorId,
			project_id: projectId,
			...zoneData
		})
		.select()
		.single();

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true, zone: data };
}

async function updateZone(zoneId, updates) {
	const { error } = await window.supabaseClient
		.from('zones')
		.update(updates)
		.eq('id', zoneId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

async function deleteZone(zoneId) {
	const { error } = await window.supabaseClient
		.from('zones')
		.delete()
		.eq('id', zoneId);

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

async function listFloorZones(floorId) {
	const { data, error } = await window.supabaseClient
		.from('zones')
		.select('*')
		.eq('floor_id', floorId);

	if (error) {
		return { success: false, zones: [], error: error.message };
	}

	return { success: true, zones: data || [] };
}

window.createZone = createZone;
window.updateZone = updateZone;
window.deleteZone = deleteZone;
window.listFloorZones = listFloorZones;

async function loadProjectHierarchy(projectId) {
	const { data, error } = await window.supabaseClient
		.from('projects')
		.select(`
			*,
			blocks (
				*,
				floors (
					*,
					zones (*)
				)
			)
		`)
		.eq('id', projectId)
		.single();

	if (error) {
		return { success: false, project: null, error: error.message };
	}

	return { success: true, project: data };
}

window.loadProjectHierarchy = loadProjectHierarchy;
