const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');

(async () => {
  let browser;
  try {
    const lobbyUrl = pathToFileURL(path.resolve('lobby_v11.1.html')).href;
    const email = `autotest_${Date.now()}@jsj.pt`;
    const password = 'AutoTest@12345!';
    const projectName = `Task2.1-Test-${Date.now()}`;

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(lobbyUrl, { waitUntil: 'domcontentloaded' });

    const availability = await page.evaluate(() => ({
      supabaseClient: typeof window.supabaseClient,
      signupUser: typeof window.signupUser,
      loginUser: typeof window.loginUser,
      createProject: typeof window.createProject,
      listUserProjects: typeof window.listUserProjects
    }));

    console.log('Availability:', availability);
    if (availability.supabaseClient !== 'object') {
      throw new Error('supabaseClient indisponível');
    }

    const signupResult = await page.evaluate(async ({ email, password }) => {
      return await window.signupUser(email, password);
    }, { email, password });
    console.log('Signup:', signupResult);

    const loginResult = await page.evaluate(async ({ email, password }) => {
      return await window.loginUser(email, password);
    }, { email, password });
    console.log('Login:', loginResult);

    if (!loginResult || !loginResult.success) {
      throw new Error(`Login falhou: ${loginResult?.error || 'erro desconhecido'}`);
    }

    const createResult = await page.evaluate(async ({ projectName }) => {
      return await window.createProject({ nome_projeto: projectName, cliente: 'JSJ-Autotest' });
    }, { projectName });
    console.log('createProject:', createResult);

    if (!createResult || !createResult.success || !createResult.project?.id) {
      throw new Error(`createProject falhou: ${createResult?.error || 'retorno inválido'}`);
    }

    const listResult = await page.evaluate(async () => {
      return await window.listUserProjects();
    });
    console.log('listUserProjects count:', listResult?.projects?.length || 0);

    if (!listResult || !listResult.success || !Array.isArray(listResult.projects)) {
      throw new Error(`listUserProjects falhou: ${listResult?.error || 'retorno inválido'}`);
    }

    const found = listResult.projects.some((project) => project.id === createResult.project.id);
    if (!found) {
      throw new Error('Projeto criado não encontrado na listagem');
    }

    const cleanup = await page.evaluate(async ({ projectId }) => {
      return await window.deleteProject(projectId);
    }, { projectId: createResult.project.id });
    console.log('cleanup:', cleanup);

    console.log('VALIDACAO_TASK_2_1_2_OK');
    process.exit(0);
  } catch (error) {
    console.error('VALIDACAO_TASK_2_1_2_FAIL:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
