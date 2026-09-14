#!/usr/bin/env bash
# Builds a fresh single-branch history for this repository and commits the
# current working tree as eight separate changes.
#
#   bash scripts/create-clean-history.sh
#
# It does not touch GitHub. Nothing on the remote changes until you push,
# and the push command is printed at the end.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

NEW_BRANCH="main"

echo "Repository : $REPO_ROOT"
echo "New branch : $NEW_BRANCH"
echo "Author     : $(git config user.name) <$(git config user.email)>"
echo

if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null | grep -v '^D ' || true)" ]; then
  echo "Note: there are staged modifications; they will be included."
fi

if git show-ref --verify --quiet "refs/heads/$NEW_BRANCH"; then
  if git rev-parse --verify --quiet "origin/$NEW_BRANCH" > /dev/null; then
    echo "ERROR: branch '$NEW_BRANCH' exists and has already been pushed."
    echo "Rewriting it here would diverge from GitHub. Sort that out by hand."
    exit 1
  fi
  echo "A local branch '$NEW_BRANCH' already exists and has never been pushed."
  echo "It will be deleted and rebuilt from the current files."
  read -r -p "Replace it? [y/N] " replace
  case "$replace" in
    [yY]|[yY][eE][sS]) ;;
    *) echo "Cancelled."; exit 0 ;;
  esac
  git checkout --quiet --orphan "__rebuild_$$"
  git branch -D "$NEW_BRANCH" > /dev/null
  git reset --quiet
fi

echo "This will:"
echo "  1. start a new branch '$NEW_BRANCH' with no previous history"
echo "  2. create 12 commits from the current files"
echo "  3. delete the local branches 'master' and 'reward-redemption'"
echo
echo "Your files on disk are not modified. The remote is not touched."
read -r -p "Continue? [y/N] " reply
case "$reply" in
  [yY]|[yY][eE][sS]) ;;
  *) echo "Cancelled."; exit 0 ;;
esac

git checkout --orphan "$NEW_BRANCH"
git reset

commit_chunk() {
  local message="$1"
  shift
  git add -- "$@"
  if git diff --cached --quiet; then
    echo "  skipped (nothing to add): $message"
    return
  fi
  git commit --quiet -m "$message"
  echo "  $(git rev-parse --short HEAD)  $message"
}

echo
echo "Creating commits:"

commit_chunk "Add gitignore and local environment setup script" \
  .gitignore scripts/

commit_chunk "Add Spring Boot project and application configuration" \
  backend/pom.xml \
  backend/src/main/resources/application.yml \
  backend/src/main/java/com/ces/rewards/RewardRedemptionApplication.java \
  backend/src/main/java/com/ces/rewards/config/BusinessProperties.java \
  backend/src/main/java/com/ces/rewards/config/ClockConfig.java \
  backend/src/main/java/com/ces/rewards/config/JwtProperties.java \
  backend/src/main/java/com/ces/rewards/config/SeedProperties.java

commit_chunk "Add initial database schema" \
  backend/src/main/resources/db/migration/V1__initial_schema.sql

commit_chunk "Seed reward categories and catalog items" \
  backend/src/main/resources/db/migration/V2__reward_catalog_seed.sql

commit_chunk "Add JPA entities for the domain model" \
  backend/src/main/java/com/ces/rewards/entity/

commit_chunk "Add Spring Data repositories" \
  backend/src/main/java/com/ces/rewards/repository/

commit_chunk "Add consistent API error responses" \
  backend/src/main/java/com/ces/rewards/exception/

commit_chunk "Add JWT authentication and role based access control" \
  backend/src/main/java/com/ces/rewards/security/ \
  backend/src/main/java/com/ces/rewards/config/SecurityConfig.java

commit_chunk "Add login, refresh and password change endpoints" \
  backend/src/main/java/com/ces/rewards/dto/request/LoginRequest.java \
  backend/src/main/java/com/ces/rewards/dto/request/RefreshRequest.java \
  backend/src/main/java/com/ces/rewards/dto/request/ChangePasswordRequest.java \
  backend/src/main/java/com/ces/rewards/dto/response/AuthUserResponse.java \
  backend/src/main/java/com/ces/rewards/dto/response/LoginResponse.java \
  backend/src/main/java/com/ces/rewards/service/AuthService.java \
  backend/src/main/java/com/ces/rewards/service/RefreshTokenService.java \
  backend/src/main/java/com/ces/rewards/controller/AuthController.java \
  backend/src/main/java/com/ces/rewards/seed/

commit_chunk "Add customer, card, transaction and reward endpoints" \
  backend/src/main/java/com/ces/rewards/dto/request/CreateCesUserRequest.java \
  backend/src/main/java/com/ces/rewards/dto/request/CreateCustomerRequest.java \
  backend/src/main/java/com/ces/rewards/dto/request/AddCreditCardRequest.java \
  backend/src/main/java/com/ces/rewards/dto/request/AddToCartRequest.java \
  backend/src/main/java/com/ces/rewards/dto/request/UpdateCartQuantityRequest.java \
  backend/src/main/java/com/ces/rewards/dto/response/ \
  backend/src/main/java/com/ces/rewards/service/ \
  backend/src/main/java/com/ces/rewards/controller/

commit_chunk "Add React frontend with branding, routing and sign in" \
  frontend/

commit_chunk "Add README and project documentation" \
  README.md docs/

echo
echo "Removing old branches:"
for old in master reward-redemption staging "__rebuild_$$"; do
  if git show-ref --verify --quiet "refs/heads/$old"; then
    git branch -D "$old" >/dev/null
    echo "  deleted $old"
  fi
done

echo
echo "History now:"
git log --oneline --reverse

REMAINING="$(git status --porcelain | wc -l)"
echo
if [ "$REMAINING" -eq 0 ]; then
  echo "Working tree is clean. Every file is committed."
else
  echo "WARNING: $REMAINING path(s) are still uncommitted:"
  git status --short
fi

echo
echo "Nothing has been sent to GitHub yet."
echo "When you are ready to replace the remote history, run:"
echo
echo "    git push -f origin $NEW_BRANCH"
echo
echo "That permanently deletes the 173 old commits on GitHub and cannot be undone."
echo "If you would rather keep them, first run:"
echo
echo "    git push origin refs/remotes/origin/master:refs/heads/legacy-pipeline"
echo
echo "After pushing, set the default branch to '$NEW_BRANCH' in the repository"
echo "settings on GitHub, then delete the old 'master' branch there."
