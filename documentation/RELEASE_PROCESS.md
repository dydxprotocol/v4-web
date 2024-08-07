# Web Release Process Guide

## **Creating a New Release**

### **Step 1: Create a Tag**

Before creating a release, finalize the changes that will be included. Ensure all changes are merged into the main branch and that the project is in a stable state for release.

- Doing it manually (the old way)

  1.  **Check out the main branch**:

      ```bash
      git checkout main
      git pull origin main
      ```

  2.  **Tag the release**:
      Use semantic versioning for tagging and prefix the tag with `release/` (e.g., **`release/v1.0.0`**, **`release/v1.0.1`** for fixes, **`release/v1.1.0`** for minor features, **`release/v2.0.0`** for major changes). Replace **`release/vX.Y.Z`** with your version number.
      `bash
git tag -a release/vX.Y.Z -m "v4-web release vX.Y.Z"
`
  3.  **Push the tag to GitHub**:
      This makes the tag available to other team members and triggers our GitHub Actions workflow.
      `bash
git push origin release/vX.Y.Z
`

To create a tag, use this command

```bash
pnpm run tag
```

This script will ask you whether the intended release is a patch, minor, or major version.

**Although [semver guidelines](https://semver.org/) define a minor version to be one that “add(s) functionality in a backward compatible manner”, we have a different definition internal to dYdX.**

At dYdX we define our semver as so:

- patch: bugfix or backwards compatible change
- minor: breaking change
- major: architectural re-design.

In the future, we may redefine our internal definition to align with semver’s guidelines.

### **Step 2: GitHub Action Syncs the Release Branch**

Our GitHub Action will automatically:

- Detect the newly created tag.
- Sync the **`release`** branch to match the state of the tagged commit.

There's no manual intervention required here; our workflow ensures the **`release`** branch always mirrors the latest release, ready for deployment.

### **Step 3: Create a Release from the Tag via GitHub**

After pushing the tag, create a GitHub release:

1. **Navigate to the 'Releases' section** of our GitHub repository.
2. **Click 'Draft a new release'** or select the tag from the list and click 'Create release'.
3. **Fill in the release details**:
   - **Tag version**: Should auto-populate. Confirm it matches the tag you pushed.
   - **Release title**: A readable version name.
   - Click `Generate Release Note`
   - **Description**: Include key changes, bug fixes, and any notable information. This is crucial for documentation and helps users understand what's included in the release.
4. Send a message in Slack in [#release-web](https://dydx-team.slack.com/archives/C06MQKAL8DB) to inform the web team. Tag everyone that has contributed to this release. Use this template:

   ```
   Planning to create release vx.x.x in ~1 hour.
   Please comment in thread if there are concerns or special instructions required.

   cc @[everyone that contributed to this release]
   ```

5. **Publish the release**.

### **Step 4: Deployment**

The deployer (or automated deployment process) will use the **`release`** branch for deploying the latest version to production. This ensures a consistent deployment process, relying on the **`release`** branch as the source of truth for production deployments.

## **Managing Hotfixes**

### **Creating a Hotfix**

For urgent fixes that need to be deployed before the next regular release:

1.  **Identify the issue** and create a fix in a new branch off the `main` branch:

    ```bash
    git checkout main
    git checkout -b hotfix-your-fix-description
    ```

2.  **Implement your fix**, commit the changes, and push the branch:

    ```bash
    git commit -am "Describe the hotfix"
    git push origin hotfix-your-fix-description
    ```

3.  **Create a Pull Request (PR)** for the hotfix branch into the `main` branch on GitHub. Ensure it's reviewed and tested according to our standards.
4.  **Merge the PR** once approved.
5.  **Check out the main branch**:

    ```bash
    git checkout main
    git pull origin main
    ```

6.  **Tag the hotfix**:
    Use semantic versioning for tagging and prefix the tag with `hotfix/` and increment the patch version (**e.g** a hotfix for `release/v1.0.0` would be `hotfix/v1.0.1` )
    `bash
git tag -a hotfix/vX.Y.Z -m "v4-web hotfix vX.Y.Z"
`
7.  **Release branch** will be automatically updated with the tagged hotfix
