Implementation Plan - Multi-Project Data Refactor (Phase 1)
Goal Description
Refactor the global data structure in
Index_v9.1.html
from a single-project model (projectData) to an app-centric model (appState) supporting multiple projects. Crucially, maintain backward compatibility for existing code using a Proxy pattern for the global projectData variable. Convert floors and equipa arrays to UUID-indexed Objects.
User Review Required
IMPORTANT
Data Structure Change: floors and equipa will change from Arrays [] to Objects { uuid: data }. Proxy Limitation: Array-mutation methods (push, splice) on projectData.floors will NOT work automatically via the Proxy. Functions like
addFloor
and
deleteFloor
MUST be refactored to use appState directly. ID Mapping: Loading old JSONs requires mapping integer IDs (timestamps) to new UUIDs during
loadAllData
.
Proposed Changes
Index_v9.1.html
[MODIFY] Global Data Structure
Initialize appState constant.
Replace projectData initialization with a Proxy definition.
Implement initNewProject() to create a fresh project instance in appState.
Implement uuidv4() utility (or use crypto.randomUUID).
javascript
/* structure */
const appState = {
activeProjectId: null,
projects: {
// [uuid]: { ...projectData }
}
};
// Legacy Bridge
var projectData = new Proxy({}, {
get: function(target, prop) {
if (!appState.activeProjectId) return undefined;
const activeProject = appState.projects[appState.activeProjectId];
// Intercept array access for 'floors' to return Array for legacy loops
if (prop === 'floors') {
return Object.values(activeProject.floors);
}
if (prop === 'equipa') { // Assuming 'equipa' is similar
return Object.values(activeProject.equipa || {});
}
return activeProject[prop];
},
set: function(target, prop, value) {
if (!appState.activeProjectId) return false;
appState.projects[appState.activeProjectId][prop] = value;
return true;
}
});
[MODIFY] Data Loading & Saving
collectAllData()
: Update to read from appState (or via Proxy) and serialize to the new format.
loadAllData(json)
:
Detect if JSON is legacy (Array floors) or new (Object floors).
Convert legacy IDs to UUIDs if necessary.
Populate appState.projects.
[MODIFY] State Management Functions
addFloor()
: Refactor to generate UUID and add to appState...floors[uuid].
deleteFloor(id)
: Refactor to delete from appState...floors[id].
renderFloors()
: Update to handle the data source (Proxy returning array works for .map, but need to ensure ID usage is correct).
Self-correction: The Proxy returns an array of values, so .map works. The objects inside still have their
id
property.
Crucial: Ensure
id
property in the floor object matches its key in the floors object? Or just use the
id
property?
Plan: Keep
id
inside the object for ease of use, ensure it matches the key.
[MODIFY] Team Management (Equipa)
Similar refactor for equipa if it exists (need to check if it's currently an array or just set of fields).
Observation:
AGENTE_RISCOS_v2.md
lists equipa fields in "2.1 Secção 1". I need to check if there is an equipa array in JS or just specific fields. The user request says "Refactor Arrays -> Mapas ... Altera pisos e equipa". I will check the code for equipa array.
Verification Plan
Manual Verification
Load Page: Open HTML (JS verification).
Console Check:
appState exists.
initNewProject() creates a project.
projectData.floors returns an array (via Proxy).
addFloor()
adds a floor to appState and projectData.floors reflects it.
Data Persistence:
collectAllData()
returns valid JSON with UUIDs.
loadAllData()
accepts the JSON and restores state.
Automated Checks (via Browser Subagent or simple JS execution)
I will use read_browser_page/browser_subagent if available, or just inspect code logic since I can't easily run a full browser test suite in this environment without a server. I will rely on careful code review and potentially writing a small test script block I can run in node if I strip DOM deps, or just logic verification. Actually, I can use the browser tool to open the file file:///... if permitted, or just trust the logic changes.
Specific Check:
Run a JS snippet in console (simulated) to verify Proxy behavior.