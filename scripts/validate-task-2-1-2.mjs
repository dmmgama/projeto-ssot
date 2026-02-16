import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const lobbyPath = path.resolve('lobby_v11.1.html');
const lobbyUrl = pathToFileURL(lobbyPath).href;

const email = `autotest_${Date.now()}@jsj.pt`;
const password = 'AutoTest@12345!';
const projectName = `Task2.1-Test-${Date.now()}`;

let browser;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('SUPABASE DEBUG') || text.includes('Supabase client')) {
      console.log('[browser]', text);
    }
  });

  await page.goto(lobbyUrl, { waitUntil: 'domcontentloaded' });

  const availability = await page.evaluate(() => ({
    supabaseClient: typeof window.supabaseClient,
    signupUser: typeof window.signupUser,
    loginUser: typeof window.loginUser,
    createProject: typeof window.createProject,
    listUserProjects: typeof window.listUserProjects
  }));

  console.log('Availability:', availability);

  if (availability.supabaseClient !== 'object' || availability.signupUser !== 'function' || availability.loginUser !== 'function') {
    throw new Error('Supabase/auth functions indisponíveis no lobby_v11.1.html');
  }

  const signupResult = await page.evaluate(async ({ email, password }) => {
    return await window.signupUser(email, password);
  }, { email, password });
  console.log('Signup result:', signupResult);

  const loginResult = await page.evaluate(async ({ email, password }) => {
    return await window.loginUser(email, password);
  }, { email, password });
  console.log('Login result:', loginResult);

  if (!loginResult?.success) {
    throw new Error(`Login falhou: ${loginResult?.error || 'erro desconhecido'}`);
  }

  const createProjectResult = await page.evaluate(async ({ projectName }) => {
    return await window.createProject({ nome_projeto: projectName, cliente: 'JSJ-Autotest' });
  }, { projectName });
  console.log('createProject result:', createProjectResult);

  if (!createProjectResult?.success || !createProjectResult?.project?.id) {
    throw new Error(`createProject falhou: ${createProjectResult?.error || 'sem id retornado'}`);
  }

  const listResult = await page.evaluate(async () => {
    return await window.listUserProjects();
  });
  console.log('listUserProjects result count:', listResult?.projects?.length || 0);

  if (!listResult?.success || !Array.isArray(listResult.projects)) {
    throw new Error(`listUserProjects falhou: ${listResult?.error || 'retorno inválido'}`);
  }

  const found = listResult.projects.some((p) => p.id === createProjectResult.project.id);
  if (!found) {
    throw new Error('Projeto criado não encontrado em listUserProjects');
  }

  const cleanup = await page.evaluate(async ({ projectId }) => {
    return await window.deleteProject(projectId);
  }, { projectId: createProjectResult.project.id });
  console.log('cleanup deleteProject:', cleanup);

  console.log('✅ VALIDACAO_TASK_2_1_2_OK');
  process.exitCode = 0;
} catch (error) {
  console.error('❌ VALIDACAO_TASK_2_1_2_FAIL:', error.message);
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.close();
  }
}
