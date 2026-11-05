import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { GraphQLSchema, Kind, extendSchema, graphql, parse } from 'graphql';
import { resolvers as scalarResolvers } from 'graphql-scalars';

const SCHEMA_DIR = path.join(import.meta.dirname, 'schema');
const RESOLVER_DIR = path.join(import.meta.dirname, 'resolver');

// Every schema file adds its operations with `extend type Query` /
// `extend type Mutation`. GraphQL needs at least one field per type,
// hence the `_empty` placeholders.
const BASE_SCHEMA = `
type Query { _empty: Boolean }
type Mutation { _empty: Boolean }
`;

const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

async function listFiles(dir, suffix) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => entry.name)
    .sort(byName);
}

// `scalar X` declarations whose name is a graphql-scalars type (UUID,
// EmailAddress, DateTime…). Those use the library's implementation, which
// validates and converts values; any other scalar stays a plain pass-through.
const isLibraryScalar = (definition) =>
  definition.kind === Kind.SCALAR_TYPE_DEFINITION &&
  Object.hasOwn(scalarResolvers, definition.name.value);

// Joins schema/*.graphql after the base document and builds the schema.
async function loadSchema() {
  const files = await listFiles(SCHEMA_DIR, '.graphql');
  const parts = await Promise.all(
    files.map((file) => fs.readFile(path.join(SCHEMA_DIR, file), 'utf8')),
  );
  const document = parse([BASE_SCHEMA, ...parts].join('\n'));

  // Start from a schema that already holds the graphql-scalars types used in
  // the files, then add everything else on top of it.
  const scalarNames = new Set(
    document.definitions.filter(isLibraryScalar).map((d) => d.name.value),
  );
  const base = new GraphQLSchema({
    types: [...scalarNames].map((name) => scalarResolvers[name]),
  });
  const extended = extendSchema(base, {
    ...document,
    definitions: document.definitions.filter((d) => !isLibraryScalar(d)),
  });

  return new GraphQLSchema({
    ...extended.toConfig(),
    query: extended.getType('Query'),
    mutation: extended.getType('Mutation'),
  });
}

// Merges the default export of every resolver/*Res.js into one root object.
async function loadResolvers() {
  const files = await listFiles(RESOLVER_DIR, 'Res.js');
  const root = {};
  const owner = {};
  for (const file of files) {
    const url = pathToFileURL(path.join(RESOLVER_DIR, file)).href;
    const { default: resolvers } = await import(url);
    for (const [name, fn] of Object.entries(resolvers ?? {})) {
      if (owner[name]) {
        throw new Error(
          `GraphQL resolver "${name}" is defined in both ${owner[name]} and ${file}.`,
        );
      }
      owner[name] = file;
      root[name] = fn;
    }
  }
  return root;
}

const [schema, rootValue] = await Promise.all([loadSchema(), loadResolvers()]);

/**
 * Runs a GraphQL operation against the app schema.
 * @returns {Promise<{data?, errors?}>}
 */
export function executeGraphql({ query, variables, operationName, context }) {
  return graphql({
    schema,
    source: query,
    rootValue,
    variableValues: variables,
    operationName,
    contextValue: context,
  });
}
