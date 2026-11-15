// Changelogen configuration for automated changelog generation
// https://github.com/unjs/changelogen

export default {
  // GitHub repository
  repo: {
    name: 'yapmod/web',
  },

  // Exclude bot commits from changelog
  excludeAuthors: ['dependabot[bot]'],

  // Output file
  output: 'CHANGELOG.md',

  // Commit types
  types: {
    feat: {title: '🚀 Enhancements', semver: 'minor'},
    fix: {title: '🩹 Fixes', semver: 'patch'},
    perf: {title: '⚡ Performance', semver: 'patch'},
    docs: {title: '📖 Documentation', semver: 'patch'},
    chore: {title: '🏡 Chore', semver: 'patch'},
    refactor: {title: '💅 Refactors', semver: 'patch'},
    test: {title: '✅ Tests', semver: 'patch'},
    ci: {title: '🤖 CI', semver: 'patch'},
    build: {title: '📦 Build', semver: 'patch'},
  },
};
