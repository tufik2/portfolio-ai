import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSchema, graphql } from 'graphql';

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

// Joins schema/*.graphql after the base document and builds the schema.
async function loadSchema() {
  const files = await listFiles(SCHEMA_DIR, '.graphql');
  const parts = await Promise.all(
    files.map((file) => fs.readFile(path.join(SCHEMA_DIR, file), 'utf8')),
  );
  return buildSchema([BASE_SCHEMA, ...parts].join('\n'));
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
