/**
 * Architecture enforcement rules.
 *
 * This file is what turns "the domain layer must stay pure" from a
 * promise in a README into a rule that actually breaks the CI build.
 * Run `npm run lint:architecture` locally, and wire it into CI before
 * merging any pull request that touches `domain/`.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-must-not-depend-on-nestjs',
      comment:
        'The domain layer must be plain TypeScript. It must never import ' +
        '@nestjs/*, so that business rules stay testable without booting a framework.',
      severity: 'error',
      from: { path: '^src/modules/.+/domain' },
      to: { path: '^node_modules/@nestjs' },
    },
    {
      name: 'domain-must-not-depend-on-persistence',
      comment:
        'The domain layer must not know about Prisma or any other ORM/driver. ' +
        'Persistence concerns belong to infrastructure, accessed only through ports.',
      severity: 'error',
      from: { path: '^src/modules/.+/domain' },
      to: { path: '^node_modules/(@prisma|prisma)' },
    },
    {
      name: 'domain-must-not-depend-on-application-or-infrastructure',
      comment:
        'Dependencies point inward: domain knows nothing about application ' +
        'use cases or infrastructure adapters.',
      severity: 'error',
      from: { path: '^src/modules/(?<mod>.+)/domain' },
      to: { path: '^src/modules/\\k<mod>/(application|infrastructure|presentation)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
  },
};
