if [ "$TRAVIS_PULL_REQUEST" = "false" ] && [ "$TRAVIS_SECURE_ENV_VARS" = "true" ]; then
    echo "Publishing to https://github.com/${TRAVIS_REPO_SLUG}/tree/gh-pages/dist/${TRAVIS_BRANCH} ..." &&
    git clone "https://github.com/${TRAVIS_REPO_SLUG}.git" -b gh-pages gh-pages && cd gh-pages &&
    git config user.email "releasebot@ariatemplates.com" &&
    git config user.name "Release Bot" &&
    mkdir -p "dist/${TRAVIS_BRANCH}" &&
    find ../dist -name "*.gz" -delete &&
    cp -rf ../dist/browser/* "dist/${TRAVIS_BRANCH}/" &&
    if [ "${TRAVIS_BRANCH}" = "stable" ]; then
        cp -rf ../dist/doc/* .
    fi &&
    git add . &&
    git commit -m "Build ${TRAVIS_COMMIT} (${TRAVIS_BRANCH})" &&
    git push --quiet "https://${GH_CREDENTIALS}@github.com/${TRAVIS_REPO_SLUG}.git" gh-pages &> /dev/null &&
    echo "Successfully published to https://github.com/${TRAVIS_REPO_SLUG}/tree/gh-pages/dist/${TRAVIS_BRANCH}"
fi
