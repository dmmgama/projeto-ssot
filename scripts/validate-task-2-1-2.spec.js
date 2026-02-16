const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

test('validate task 2.1-2.2 create/list projects', async ({ page }) => {
  const lobbyPath = path.resolve('lobby_v11.1.html');
  const lobbyUrl = pathToFileURL(lobbyPath).href;

  const email = `autotest_${Date.now()}@jsj.pt`;
  const password = 'AutoTest@12345!';
  const projectName = `Task2.1-Test-${Date.now()}`;

  await page.goto(lobbyUrl, { waitUntil: 'domcontentloaded' });

  const availability = await page.evaluate(() => ({
    supabaseClient: typeof window.supabaseClient,
    signupUser: typeof window.signupUser,
    loginUser: typeof window.loginUser,
    createProject: typeof window.createProject,
    listUserProjects: typeof window.listUserProjects
  }));

  expect(availability.supabaseClient).toBe('object');
  expect(availability.signupUser).toBe('function');
  expect(availability.loginUser).toBe('function');

  const signupResult = await page.evaluate(async ({ email, password }) => {
    return await window.signupUser(email, password);
  }, { email, password });

  const loginResult = await page.evaluate(async ({ email, password }) => {
    return await window.loginUser(email, password);
  }, { email, password });

  expect(loginResult.success, `Login falhou: ${loginResult.error || 'erro desconhecido'}`).toBeTruthy();

  const createProjectResult = await page.evaluate(async ({ projectName }) => {
    return await window.createProject({ nome_projeto: projectName, cliente: 'JSJ-Autotest' });
  }, { projectName });

  expect(createProjectResult.success, `createProject falhou: ${createProjectResult.error || 'sem erro explícito'}`).toBeTruthy();
  expect(createProjectResult.project && createProjectResult.project.id).toBeTruthy();

  const listResult = await page.evaluate(async () => {
    return await window.listUserProjects();
  });

  expect(listResult.success, `listUserProjects falhou: ${listResult.error || 'sem erro explícito'}`).toBeTruthy();
  expect(Array.isArray(listResult.projects)).toBeTruthy();

  const found = listResult.projects.some((p) => p.id === createProjectResult.project.id);
  expect(found).toBeTruthy();

  await page.evaluate(async ({ projectId }) => {
    await window.deleteProject(projectId);
  }, { projectId: createProjectResult.project.id });

  console.log('✅ VALIDACAO_TASK_2_1_2_OK');
});
