if (!window.supabaseClient) {
	throw new Error('supabaseClient não inicializado. Carrega js/supabase-config.js antes de js/supabase-realtime.js');
}

function subscribeToProject(projectId, callback) {
	const channel = window.supabaseClient
		.channel(`project-${projectId}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'projects',
				filter: `id=eq.${projectId}`
			},
			(payload) => {
				if (typeof callback === 'function') {
					callback(payload);
				}
			}
		)
		.subscribe();

	const unsubscribe = () => {
		window.supabaseClient.removeChannel(channel);
	};

	window.addEventListener('beforeunload', unsubscribe);

	return { channel, unsubscribe };
}

window.subscribeToProject = subscribeToProject;
