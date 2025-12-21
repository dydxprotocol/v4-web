import SimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector';
import AggregatesPluggin from '@graphile/pg-aggregates';
import express from 'express';
import { NodePlugin } from 'graphile-build';
import type * as pg from 'pg';
import { gql, makeExtendSchemaPlugin, postgraphile, Plugin } from 'postgraphile';
import FilterPlugin from 'postgraphile-plugin-connection-filter';

const app = express();

export const ProcessorStatusPlugin: Plugin = makeExtendSchemaPlugin((build, options) => {
  const schemas: string[] = options.stateSchemas || ['squid_processor'];

  return {
    typeDefs: gql`
      type _ProcessorStatus {
        name: String!
        height: Int!
        hash: String!
      }

      extend type Query {
        squidStatus: [_ProcessorStatus!]!
      }
    `,
    resolvers: {
      Query: {
        squidStatus: async (_parentObject, _args, context, _info) => {
          const pgClient: pg.Client = context.pgClient;

          const { rows } = await pgClient.query(
            schemas
              .map((s) => `SELECT '${s}' as name , height, hash FROM ${s}.status`)
              .join(' UNION ALL ')
          );

          return rows;
        },
      },
    },
  };
});

app.get('/graphql', (_req, res, _next) => {
  const graphiqlPath: string =
    process.env.BASE_PATH == null ? '/graphiql' : `${process.env.BASE_PATH}/api/graphiql`;
  res.send(
    `<div>Welcome to the GraphQL API of SQD&#39;s <a href=https://github.com/subsquid-labs/squid-postgraphile-example>Postgraphile example squid</a>!</div><div><a href=${graphiqlPath}>The GraphiQL playground is here.</a></div>`
  );
});

app.use(
  postgraphile(
    {
      host: process.env.DB_HOST ?? 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      database: process.env.DB_NAME ?? 'postgres',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASS ?? 'postgres',
    },
    'public',
    {
      graphiql: true,
      enhanceGraphiql: true,
      watchPg: true,
      dynamicJson: true,
      disableDefaultMutations: true,
      disableQueryLog: true, // set to false to see the processed queries
      skipPlugins: [NodePlugin],
      appendPlugins: [
        AggregatesPluggin,
        FilterPlugin,
        SimplifyInflectorPlugin,
        ProcessorStatusPlugin,
      ],
      externalGraphqlRoute:
        process.env.BASE_PATH == null ? undefined : `${process.env.BASE_PATH}/api/graphql`,
      graphileBuildOptions: {
        stateSchemas: ['squid_processor'],
      },
    }
  )
);

app.listen(process.env.GRAPHQL_SERVER_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Squid API listening on port ${process.env.GRAPHQL_SERVER_PORT}`);
});
