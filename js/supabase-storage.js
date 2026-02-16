if (!window.supabaseClient) {
	throw new Error('supabaseClient não inicializado. Carrega js/supabase-config.js antes de js/supabase-storage.js');
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

async function uploadFloorImage(floorId, projectId, file) {
	try {
		if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type) || file.size >= MAX_IMAGE_SIZE_BYTES) {
			return { success: false, error: 'Invalid file type/size' };
		}

		const { user } = await window.getCurrentUser();
		if (!user?.id) {
			return { success: false, error: 'Utilizador não autenticado' };
		}

		const path = `${user.id}/${projectId}/${floorId}.png`;

		const { error: uploadError } = await window.supabaseClient.storage
			.from('floor-images')
			.upload(path, file, { upsert: true });

		if (uploadError) {
			return { success: false, error: uploadError.message };
		}

		if (typeof window.updateFloor !== 'function') {
			return { success: false, error: 'updateFloor não disponível' };
		}

		const updateResult = await window.updateFloor(floorId, { image_path: path });
		if (!updateResult.success) {
			return { success: false, error: updateResult.error || 'Falha ao atualizar image_path' };
		}

		return { success: true, path };
	} catch (error) {
		return { success: false, error: error.message || 'Erro no upload da imagem' };
	}
}

window.uploadFloorImage = uploadFloorImage;
