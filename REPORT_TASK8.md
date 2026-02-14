# TASK 8 REPORT - Firestore Security Rules Configuration

## Implementation Summary
**Type**: Manual configuration in Firebase Console  
**Purpose**: Enable production-ready security rules to protect Firestore data  
**Current State**: Development mode (open read/write) - **INSECURE**  
**Target State**: Protected access - only authenticated @jsj.pt users can read/write their own projects

## Why This Task Is Critical
⚠️ **SECURITY RISK**: Current Firestore instance has open permissions (test mode)  
- Anyone with your Firebase config can read/write all data
- No authentication required in current state
- All projects are publicly accessible

✅ **After Task 8**: Firestore will enforce:
- Authentication required (Firebase user must be logged in)
- Email validation (must be @jsj.pt domain)
- Ownership validation (users can only access their own projects)

## Instructions

### Step 1: Open Firebase Console
1. Navigate to: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Select your project: **jsj-ssot-template**

### Step 2: Navigate to Firestore Rules
1. In left sidebar, click **"Firestore Database"**
2. Click the **"Rules"** tab (top of page)
3. You should see the current rules (likely test mode):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // or if request.time < timestamp.date(...)
    }
  }
}
```

### Step 3: Replace with Production Rules
**Copy the rules below** and paste into the Firebase Console Rules editor:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: Check if user has JSJ email
    function isJSJEmail() {
      return request.auth.token.email.matches('.*@jsj[.]pt$');
    }
    
    // Helper: Check if user is project owner
    function isOwner(projectId) {
      return get(/databases/$(database)/documents/projects/$(projectId)).data.owner == request.auth.uid;
    }
    
    // Projects collection rules
    match /projects/{projectId} {
      // READ: Must be authenticated, JSJ email, and project owner
      allow read: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
      
      // CREATE: Must be authenticated, JSJ email, and set self as owner
      allow create: if isAuthenticated() && 
                       isJSJEmail() && 
                       request.resource.data.owner == request.auth.uid;
      
      // UPDATE: Must be authenticated, JSJ email, and project owner
      allow update: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
      
      // DELETE: Must be authenticated, JSJ email, and project owner
      allow delete: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
    }
  }
}
```

### Step 4: Publish Rules
1. Click **"Publish"** button (top-right of editor)
2. Confirm the publication
3. Wait for "Rules published successfully" message

### Step 5: Test Rules (Rules Playground)
Firebase Console has a built-in testing tool. Test these scenarios:

#### Test Case 1: Unauthenticated Access
- **Auth**: Select "Unauthenticated"
- **Location**: `/projects/any-project-id`
- **Operation**: `get`
- **Expected Result**: ❌ **DENIED**

#### Test Case 2: Authenticated but Non-JSJ Email
- **Auth**: Select "Authenticated"
- **Provider**: Custom
- **UID**: `test-user-123`
- **Email**: `external@gmail.com`
- **Location**: `/projects/any-project-id`
- **Operation**: `get`
- **Expected Result**: ❌ **DENIED** (fails isJSJEmail check)

#### Test Case 3: JSJ Email but Not Owner
- **Auth**: Select "Authenticated"
- **UID**: `user-A`
- **Email**: `usera@jsj.pt`
- **Location**: `/projects/project-owned-by-userB`
- **Operation**: `get`
- **Expected Result**: ❌ **DENIED** (fails isOwner check)

#### Test Case 4: JSJ Email and Owner
- **Auth**: Select "Authenticated"
- **UID**: `user-A`
- **Email**: `usera@jsj.pt`
- **Location**: `/projects/project-with-owner-userA`
- **Operation**: `get`
- **Expected Result**: ✅ **ALLOWED**

**Note**: For Test Case 4 to work, you'll need an actual project document in Firestore with `owner: "user-A"`

## Rules Explained

### Security Layers:

**Layer 1: Authentication**
```javascript
isAuthenticated() // request.auth != null
```
- Blocks all unauthenticated requests
- User must be logged in via Firebase Auth

**Layer 2: Email Domain Validation**
```javascript
isJSJEmail() // email matches .*@jsj.pt$
```
- Blocks external email addresses
- Only @jsj.pt domain allowed

**Layer 3: Ownership Validation**
```javascript
isOwner(projectId) // document.owner == request.auth.uid
```
- User can only access projects they created
- Enforces data isolation between users

### Create Operation Special Case:
```javascript
request.resource.data.owner == request.auth.uid
```
- When creating a project, user must set `owner` field to their own UID
- Prevents creating projects "on behalf of" other users
- This is enforced by `createProjectInFirestore()` in firebase-data.js

## Validation Checklist
After publishing rules, verify in your webapp:

- [ ] **Login still works** (login.html → lobby.html)
- [ ] **Can create new project** (lobby.html creates in Firestore)
- [ ] **Can load projects** (lobby.html shows user's projects only)
- [ ] **Can edit project** (Index_v10.2.html loads and saves)
- [ ] **Can delete project** (lobby.html delete button works)
- [ ] **Cannot access other user's projects** (try changing project ID in URL)

## Testing with Real Users

### Setup:
1. **User A**: david@jsj.pt
2. **User B**: outro@jsj.pt

### Test Scenario:
1. User A creates "Projeto Alpha"
2. User A notes the project ID (check URL: `Index_v10.2.html?project=<ID>`)
3. User B logs in
4. User B tries to access: `Index_v10.2.html?project=<User-A-Project-ID>`
5. **Expected**: Error alert + redirect to lobby.html (permission denied)

### Console Output (User B):
```
[Index] Loading project from Firestore: abc-123-xyz
❌ [Index] Load error: Missing or insufficient permissions
Alert: "❌ Erro ao carregar projeto: Missing or insufficient permissions"
→ Redirects to lobby.html
```

## Rollback Plan (If Issues Occur)

If rules break existing functionality:

### Option 1: Temporary Open Rules (INSECURE - development only)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read, write: if request.auth != null; // Only require auth
    }
  }
}
```

### Option 2: Revert to Test Mode (VERY INSECURE - last resort)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Open to all
    }
  }
}
```

**Important**: If you need to rollback, investigate the issue before re-enabling strict rules.

## Common Issues and Solutions

### Issue 1: "Missing or insufficient permissions"
**Symptom**: Cannot load projects after publishing rules  
**Cause**: `owner` field missing in existing Firestore documents  
**Solution**: 
1. Go to Firestore Console → projects collection
2. For each document, add field: `owner: "<user-uid>"`
3. Get user UID from Authentication tab

### Issue 2: "Email validation failed"
**Symptom**: @jsj.pt users cannot access data  
**Cause**: Email not verified in Firebase Auth  
**Solution**: Rules use `token.email` which is always present (authenticated users)

### Issue 3: Rules timeout
**Symptom**: Long load times or timeouts  
**Cause**: `isOwner()` function does extra `get()` call  
**Solution**: Current implementation is optimal for small datasets (~20 users)

## Files Created/Modified
- **Modified**: Firebase Console → Firestore Rules (manual)
- **No code changes** in project repository

## Next Steps
After completing Task 8:
- [ ] Verify all webapp features work with rules enabled
- [ ] Test with multiple users
- [ ] Monitor Firebase Console → Usage tab for permission errors
- **Proceed to Task 9**: Add loading states and error handling

## Task 8 Status
- [⚠️] **PENDING USER ACTION** - Manual Firebase Console configuration required
- [🔜] **NEXT**: User must publish rules and confirm functionality

---

**Once you complete the Firebase Console configuration, respond with "sim" and I'll proceed to Task 9.**
