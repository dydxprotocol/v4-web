import SimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector';
import AggregatesPluggin from '@graphile/pg-aggregates';
import PgPubsub from '@graphile/pg-pubsub';
import express from 'express';
import { NodePlugin } from 'graphile-build';
import type * as pg from 'pg';
import {
  gql,
  makeExtendSchemaPlugin,
  postgraphile,
  Plugin,
  makePluginHook,
  embed,
} from 'postgraphile';
import FilterPlugin from 'postgraphile-plugin-connection-filter';

const app = express();

export const ProcessorStatusPlugin: Plugin = makeExtendSchemaPlugin((_build, options) => {
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

// Use these topics to work around PostgreSQL's 63-byte channel name limit
// The asset (66 chars) is cut to the high 42 chars for the topic name (includes the 0x prefix)
// This allows efficient filtering: each subscriber only listens to their asset's topic
function buildCurrentPriceTopic(args: { asset: string }) {
  return `starboard:price:${args.asset.substring(0, 42)}`;
}

export const CurrentPricePlugin: Plugin = makeExtendSchemaPlugin((_build, _options) => {
  return {
    typeDefs: gql`
      type _CurrentPricePayload {
        asset: String!
        timestamp: Int!
        price: BigInt!
      }

      extend type Subscription {
        currentPriceUpdated(asset: String!): _CurrentPricePayload
          @pgSubscription(topic: ${embed(buildCurrentPriceTopic)})
      }
    `,
    resolvers: {
      Subscription: {
        currentPriceUpdated: {
          resolve: (payload, { asset }, _context, _info) => {
            // { asset }: same asset argument from the original subscription query

            // Defense in depth: verify the asset matches (in case of hash collision, though for 20 bytes it is hard)
            if (payload.asset !== asset) {
              // TODO Unfortunately, a client will receive null, use subscribePlan to filter out properly
              return null; // Filter out non-matching events
            }

            return payload;
          },
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

const pluginHook = makePluginHook([PgPubsub]);

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
      pluginHook,
      graphiql: true,
      enhanceGraphiql: true,
      watchPg: true,
      dynamicJson: true,
      subscriptions: true,
      disableDefaultMutations: true,
      disableQueryLog: true, // set to false to see the processed queries
      skipPlugins: [NodePlugin],
      appendPlugins: [
        AggregatesPluggin,
        FilterPlugin,
        SimplifyInflectorPlugin,
        ProcessorStatusPlugin,
        CurrentPricePlugin,
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
