# Repository Migration Notes

## Migration Status
Date: July 23, 2025
Status: Partially Complete

## Original Repository
- URL: https://github.com/MarvinFernie/fern-project-social-media-manager-abccdb7a
- SSH: git@github.com-abccdb7a_ef2d7070:MarvinFernie/fern-project-social-media-manager-abccdb7a.git

## Target Repository
- URL: https://github.com/Fern-Labs-Open-Source/Social-Media-Manager
- Status: Exists but lacks push permissions

## Current State
1. **Code Location**: 
   - Fork created at: https://github.com/MarvinFernie/Social-Media-Manager
   - Contains all code from the original repository

2. **Deployments**:
   - Frontend: https://app-wandering-field-8388.fly.dev (Working)
   - Backend: https://app-rough-water-3792.fly.dev (Working)
   - Both deployments are still functioning with the existing code

3. **Database**:
   - social-media-manager-dev-db (No changes needed)

## Required Actions to Complete Migration
1. **Obtain Admin Access**: Need admin permissions for the Fern-Labs-Open-Source organization
2. **Push Code**: Once permissions are granted, push the code from the fork to the organization repository
3. **Update Git Remote**: Update any CI/CD or deployment scripts to point to the new repository
4. **Clean Up**: Delete the fork and temporary repositories

## Commands to Complete Migration (when permissions are available)
```bash
# Add organization repo as remote
git remote add org https://github.com/Fern-Labs-Open-Source/Social-Media-Manager.git

# Force push to organization (requires admin access)
git push org main --force

# Update deployments if needed
fly deploy --app app-wandering-field-8388 # for frontend
fly deploy --app app-rough-water-3792 # for backend
```

## Temporary Repository
- Created: https://github.com/MarvinFernie/Social-Media-Manager-temp
- Status: Can be deleted once migration is complete
